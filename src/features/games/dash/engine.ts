/**
 * Mumbai Local Dash: the three.js side. Imported only by LocalDash.tsx, so three.js stays
 * in the game's lazy chunk (scripts/check-three.mjs).
 *
 * Look: ACES tone mapping, sRGB output, a gradient sky dome that also feeds a PMREM
 * environment per stage (soft reflections), hemisphere fill + warm key + cool rim light,
 * tinted fog, and soft geometry everywhere. Bloom and a real shadow map only on the
 * "high" tier. Simulation runs at a fixed 120 Hz step, rendering at the display rate.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Color,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Texture,
  type WebGLRenderTarget
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { radial, Textures, type Mats } from "./kit";
import {
  buildBarrier,
  buildCart,
  buildPower,
  buildRickshaw,
  buildRunner,
  buildTrain,
  CAR_LEN,
  TRAIN_CARS,
  vadaPavGeometry,
  type PowerKind
} from "./models";
import { clonePalette, lerpPalette, stagePalettes, STAGES, type DashColors } from "./palette";
import {
  createBlobs,
  createCars,
  createNecklace,
  createRain,
  createScenery,
  createSea,
  createSkyline,
  createSky,
  createSparkles,
  createSun,
  createTrack,
  createWind,
  groundTextures,
  LANES,
  STAGE_M,
  stageAt
} from "./world";

export { DASH_TOKENS } from "./palette";
export type { DashColors } from "./palette";

export type Tier = "high" | "medium" | "low";
export type TierPref = "auto" | Tier;
const TIERS: Tier[] = ["high", "medium", "low"];

export interface DashHud {
  distance: number;
  coins: number;
  score: number;
  /** Seconds left. */
  chai: number;
  fast: number;
  shield: boolean;
  stage: string;
  /** A train is coming in this lane (0..2), or -1. */
  train: number;
}
export type DashAction = "left" | "right" | "jump" | "slide";
export type DashEvent = "coin" | "lane" | "jump" | "slide" | "power" | "near" | "horn" | "hit" | "crash" | "stage";

export interface DashOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  colors: DashColors;
  reduced: boolean;
  mobile: boolean;
  tier: TierPref;
  onHud: (h: DashHud) => void;
  onEvent: (e: DashEvent, n?: number) => void;
  onOver: (r: { distance: number; coins: number; score: number }) => void;
  onTier?: (t: Tier) => void;
  /** Dev and tests: start this many metres in (to look at later stages). */
  startAt?: number;
}

export const CHAI_S = 8;
export const FAST_S = 5;
const STEP = 1 / 120;
const SPAWN_Z = -110;
const DESPAWN_Z = 14;
const START_SPEED = 13;
const MAX_SPEED = 32;
const ACCEL = 0.22; // m/s per second
const GRAVITY = 26;
const JUMP_V = 10;
const SLIDE_S = 0.7;
const TRAIN_SPEED = 20;
const TRAIN_LEN = TRAIN_CARS * (CAR_LEN + 0.15);

type Kind = "rickshaw" | "cart" | "barrier" | "train";
interface Obstacle {
  kind: Kind;
  obj: Object3D;
  active: boolean;
  passed: boolean;
  lane: number;
  z: number;
}
interface Coin {
  active: boolean;
  lane: number;
  z: number;
  y: number;
  /** Pick-up "pop" time left (s), or 0. */
  pop: number;
  x: number;
}
interface Power {
  active: boolean;
  lane: number;
  z: number;
}

// Collision boxes (half width, y range, half depth; trains extend backwards from z).
const HIT: Record<Kind, { w: number; y0: number; y1: number; d: number }> = {
  rickshaw: { w: 0.7, y0: 0, y1: 1.4, d: 1.1 },
  cart: { w: 0.7, y0: 0, y1: 1.0, d: 0.8 },
  barrier: { w: 0.98, y0: 1.05, y1: 2.4, d: 0.12 },
  train: { w: 0.95, y0: 0, y1: 3.1, d: TRAIN_LEN }
};
const SHADOW_SIZE: Record<Kind, [number, number]> = { rickshaw: [1.8, 2.6], cart: [1.8, 2.0], barrier: [2.4, 0.6], train: [2.4, 2] };

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** First guess at a tier, from the device, before the frame-time probe refines it. */
export function guessTier(mobile: boolean): Tier {
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  if (!mobile) return cores >= 8 ? "high" : cores >= 4 ? "medium" : "low";
  if (cores >= 8 && dpr <= 3) return "medium";
  return "low";
}

export function createDash(o: DashOptions) {
  const C = o.colors;
  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.info.autoReset = false;
  const tex = new Textures(Math.min(4, renderer.capabilities.getMaxAnisotropy()));
  let W = o.width;
  let H = o.height;

  const scene = new Scene();
  const camera = new PerspectiveCamera(62, W / H, 0.1, 340);
  camera.position.set(0, 3, 7);

  /* ------------------------------------------------ materials (shared) */
  const mats: Mats = {
    paint: new MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }),
    gloss: new MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.5 }),
    glass: new MeshStandardMaterial({ vertexColors: true, roughness: 0.06, metalness: 0.85 }),
    glow: new MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    add: new MeshBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide })
  };

  /* ------------------------------------------------ light and air */
  const palettes = stagePalettes(C);
  const pal = clonePalette(palettes[0]);
  const hemi = new HemisphereLight(0xffffff, 0x444444, 1);
  const sun = new DirectionalLight(0xffffff, 2);
  const KEY = new Vector3(-0.55, 0.8, 0.5).normalize();
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const sunTarget = new Object3D();
  sun.target = sunTarget;
  const rim = new DirectionalLight(C["dash-rim"], 1);
  const rimTarget = new Object3D();
  rim.target = rimTarget;
  scene.add(hemi, sun, sunTarget, rim, rimTarget);
  const fog = new Fog(0xffffff, 40, 170);
  scene.fog = fog;
  const WHITE = new Color(1, 1, 1);

  const sky = createSky();
  const sunDisc = createSun(tex);
  const skyline = createSkyline(C, tex);
  scene.add(sky.dome, sunDisc.sprite, skyline.group);

  // A soft environment per stage, rendered once from that stage's own sky (no HDR download).
  const pmrem = new PMREMGenerator(renderer);
  const envs: WebGLRenderTarget[] = palettes.map((p) => {
    const s = createSky();
    s.update(p, new Vector3());
    const envScene = new Scene();
    envScene.add(s.dome);
    const rt = pmrem.fromScene(envScene, 0.04, 0.1, 1000);
    s.dome.geometry.dispose();
    s.mat.dispose();
    return rt;
  });
  pmrem.dispose();
  let envIndex = -1;

  /* ------------------------------------------------ world */
  const gt = groundTextures(C, tex);
  const track = createTrack(C, mats, gt);
  const scenery = createScenery(C, mats, tex, gt);
  const sea = createSea(gt);
  const necklace = createNecklace(C);
  const cars = createCars(C);
  const rain = createRain(C, 700);
  const wind = createWind();
  const sparkles = createSparkles(C, tex);
  const blobs = createBlobs(C, tex);
  scene.add(track.group, scenery.group, sea.mesh, necklace.mesh, cars.mesh, rain.mesh, wind.mesh, sparkles.mesh, blobs.mesh);

  /* ------------------------------------------------ runner */
  const rig = buildRunner(C, mats);
  scene.add(rig.root);

  /* ------------------------------------------------ obstacles (pooled; clones share geometry) */
  const proto = {
    rickshaw: buildRickshaw(C, mats),
    cart: buildCart(C, mats),
    barrier: buildBarrier(C, mats, tex)
  };
  const obstacles: Obstacle[] = [];
  for (const kind of ["rickshaw", "cart", "barrier"] as const) {
    for (let i = 0; i < 4; i++) {
      const obj = i ? proto[kind].clone() : proto[kind];
      obj.visible = false;
      scene.add(obj);
      obstacles.push({ kind, obj, active: false, passed: false, lane: 0, z: 0 });
    }
  }
  const trainObj = buildTrain(C, mats, tex);
  trainObj.visible = false;
  scene.add(trainObj);
  const train: Obstacle = { kind: "train", obj: trainObj, active: false, passed: false, lane: 0, z: 0 };
  obstacles.push(train);
  const cones = trainObj.getObjectByName("cones")!;

  // Pulsing warning stripe down the train's lane.
  const warnMat = new MeshBasicMaterial({
    color: new Color(C["dash-warn"]).multiplyScalar(1.6),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false
  });
  const warn = new Mesh(new PlaneGeometry(1.7, 120), warnMat);
  warn.rotation.x = -Math.PI / 2;
  warn.position.set(0, 0.06, -55);
  warn.visible = false;
  scene.add(warn);

  /* ------------------------------------------------ coins and power-ups */
  const MAX_COINS = 70;
  const coinMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.15 });
  const coinMesh = new InstancedMesh(vadaPavGeometry(C), coinMat, MAX_COINS);
  coinMesh.count = 0;
  coinMesh.frustumCulled = false;
  coinMesh.castShadow = true;
  scene.add(coinMesh);
  const coins: Coin[] = Array.from({ length: MAX_COINS }, () => ({ active: false, lane: 0, z: 0, y: 0, pop: 0, x: 0 }));
  const COIN_TILT = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.35);

  const haloTex = tex.canvas(128, 128, (g, w, h) => radial(g, w, h, [[0, 0], [0.35, 0.15], [0.55, 0.9], [0.68, 0.25], [1, 0]]));
  const powerKinds: PowerKind[] = ["chai", "umbrella", "fast"];
  const powerObjs = Object.fromEntries(powerKinds.map((k) => [k, buildPower(k, C, mats, haloTex)])) as Record<PowerKind, Group>;
  const powers = Object.fromEntries(powerKinds.map((k) => [k, { active: false, lane: 0, z: 0 }])) as Record<PowerKind, Power>;
  const haloColor: Record<PowerKind, Color> = {
    chai: new Color(C["dash-halo-chai"]),
    umbrella: new Color(C["dash-halo-umbrella"]),
    fast: new Color(C["dash-halo-fast"])
  };
  for (const g of Object.values(powerObjs)) {
    g.visible = false;
    scene.add(g);
  }

  /* ------------------------------------------------ quality tiers */
  let pref: TierPref = o.tier;
  let tier: Tier = pref === "auto" ? guessTier(o.mobile) : pref;
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  const dprFor = (t: Tier) => {
    const d = window.devicePixelRatio || 1;
    if (t === "low") return 1;
    if (t === "medium") return Math.min(d, o.mobile ? 1.25 : 1.5);
    return Math.min(d, o.mobile ? 1.5 : 2);
  };
  const applyTier = (t: Tier) => {
    tier = t;
    renderer.setPixelRatio(dprFor(t));
    renderer.setSize(W, H, false);
    const shadows = t === "high";
    if (renderer.shadowMap.enabled !== shadows) {
      renderer.shadowMap.enabled = shadows;
      sun.castShadow = shadows;
      scene.traverse((n) => {
        const m = (n as Mesh).material as Material | Material[] | undefined;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => (x.needsUpdate = true));
      });
    }
    if (t === "high") {
      if (!composer) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        // UnrealBloomPass works from half resolution down; subtle, so only emissives glow.
        bloom = new UnrealBloomPass(new Vector2(W / 2, H / 2), 0.5, 0.45, 1.0);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
      }
      composer.setPixelRatio(dprFor(t));
      composer.setSize(W, H);
    } else if (composer) {
      composer.dispose();
      bloom?.dispose();
      composer = null;
      bloom = null;
    }
    rain.setBudget(t === "high" ? 700 : t === "medium" ? 320 : 0);
    scenery.setLow(t === "low");
    o.canvas.dataset.tier = t;
    o.onTier?.(t);
  };

  /* ------------------------------------------------ state */
  type Mode = "idle" | "frozen" | "run" | "over";
  let mode: Mode = "idle";
  const fresh = (phase = 0) => ({
    t: 0,
    speed: START_SPEED,
    distance: 0,
    coins: 0,
    bonus: 0,
    lane: 1,
    px: 0,
    prevPx: 0,
    py: 0,
    vy: 0,
    slide: 0,
    slideAmt: 0,
    squash: 0,
    chai: 0,
    fast: 0,
    shield: false,
    invuln: 0,
    shake: 0,
    crashT: -1,
    overSent: false,
    sinceSpawn: 0,
    trainIn: 240,
    powerIn: 160,
    hudT: 0,
    coinCueT: 0,
    laneT: 9,
    combo: 0,
    comboT: 0,
    phase,
    stage: 0
  });
  const st = fresh();

  const clearWorld = () => {
    obstacles.forEach((ob) => {
      ob.active = false;
      ob.obj.visible = false;
    });
    coins.forEach((c) => {
      c.active = false;
      c.pop = 0;
    });
    powerKinds.forEach((k) => {
      powers[k].active = false;
      powerObjs[k].visible = false;
    });
    warn.visible = false;
  };

  const score = () => Math.floor(st.distance) + st.coins * 10 + st.bonus;
  const hud = () =>
    o.onHud({
      distance: Math.floor(st.distance),
      coins: st.coins,
      score: score(),
      chai: Math.max(0, st.chai),
      fast: Math.max(0, st.fast),
      shield: st.shield,
      stage: STAGES[stageAt(st.distance)],
      train: train.active && train.z < -2 ? train.lane : -1
    });

  /* ------------------------------------------------ spawning */
  const trainLane = () => (train.active ? train.lane : -1);
  const freeLanes = () => [0, 1, 2].filter((l) => l !== trainLane());
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

  const spawnObstacle = (kind: Exclude<Kind, "train">, lane: number, z = SPAWN_Z) => {
    const ob = obstacles.find((x) => x.kind === kind && !x.active);
    if (!ob) return;
    Object.assign(ob, { active: true, passed: false, lane, z });
    ob.obj.position.set(LANES[lane], 0, z);
    ob.obj.visible = true;
  };
  const coinAt = (lane: number, z: number, y: number) => {
    const c = coins.find((x) => !x.active && x.pop <= 0);
    if (c) Object.assign(c, { active: true, lane, z, y, pop: 0, x: LANES[lane] });
  };
  const spawnCoins = (lane: number, n: number) => {
    for (let k = 0; k < n; k++) coinAt(lane, SPAWN_Z - k * 2.2, 0.75);
  };
  const randomKind = (): Exclude<Kind, "train"> => {
    const r = Math.random();
    return r < 0.4 ? "rickshaw" : r < 0.7 ? "cart" : "barrier";
  };

  const spawnPattern = () => {
    const lanes = freeLanes();
    if (train.active) {
      spawnCoins(pick(lanes), 5);
      return;
    }
    const r = Math.random();
    if (r < 0.35) {
      const l = pick(lanes);
      spawnObstacle(randomKind(), l);
      if (Math.random() < 0.6) spawnCoins(pick(lanes.filter((x) => x !== l)), 5);
    } else if (r < 0.6) {
      const [a, b] = lanes.sort(() => Math.random() - 0.5);
      spawnObstacle(randomKind(), a);
      spawnObstacle(randomKind(), b);
    } else if (r < 0.85) {
      spawnCoins(pick(lanes), 6);
    } else {
      // An arc of vada pav over a cart or rickshaw: jump to collect.
      const l = pick(lanes);
      spawnObstacle(Math.random() < 0.5 ? "rickshaw" : "cart", l);
      for (let k = 0; k < 5; k++) coinAt(l, SPAWN_Z + 4.4 - k * 2.2, 1.3 + Math.sin((k / 4) * Math.PI) * 1.2);
    }
  };

  const startTrain = () => {
    const lane = pick([0, 1, 2]);
    // Clear that lane ahead so the train never overlaps a parked obstacle.
    obstacles.forEach((ob) => {
      if (ob.active && ob.lane === lane && ob.z < 0) {
        ob.active = false;
        ob.obj.visible = false;
      }
    });
    const eff = st.fast > 0 ? st.speed * 1.5 : st.speed;
    Object.assign(train, { active: true, passed: false, lane, z: -(eff + TRAIN_SPEED) * 1.7 });
    trainObj.position.set(LANES[lane], 0, train.z);
    trainObj.visible = true;
    warn.position.x = LANES[lane];
    warn.visible = true;
    o.onEvent("horn");
  };

  const spawnPower = (kind = pick(powerKinds), z = SPAWN_Z) => {
    const p = powers[kind];
    if (p.active) return;
    Object.assign(p, { active: true, lane: pick(freeLanes()), z });
    powerObjs[kind].visible = true;
  };

  /* ------------------------------------------------ simulation */
  const crash = () => {
    mode = "over";
    st.crashT = 0;
    st.shake = o.reduced ? 0 : 0.7;
    sparkles.burst(st.px, st.py + 1, -0.4, 26, new Color(C["dash-warn"]));
    o.onEvent("crash");
    hud();
  };

  const step = (dt: number) => {
    if (mode === "idle") {
      // Attract mode on the start screen: an easy jog through Dadar.
      st.t += dt;
      st.distance += 7 * dt;
      return;
    }
    if (mode !== "run") return;
    st.t += dt;
    st.speed = Math.min(MAX_SPEED, st.speed + ACCEL * dt);
    const eff = st.fast > 0 ? st.speed * 1.5 : st.speed;
    const dz = eff * dt;
    st.distance += dz;

    st.prevPx = st.px;
    st.px += (LANES[st.lane] - st.px) * Math.min(1, dt * 15);
    if (st.py > 0 || st.vy > 0) {
      st.vy -= GRAVITY * dt;
      st.py = Math.max(0, st.py + st.vy * dt);
      if (st.py === 0) {
        st.vy = 0;
        st.squash = 1;
      }
    }
    st.slide = Math.max(0, st.slide - dt);
    st.chai -= dt;
    st.fast -= dt;
    st.invuln -= dt;
    st.coinCueT -= dt;
    st.laneT += dt;
    st.comboT -= dt;
    if (st.comboT <= 0) st.combo = 0;

    st.sinceSpawn += dz;
    if (st.sinceSpawn >= Math.max(14, 27 - st.speed * 0.4)) {
      st.sinceSpawn = 0;
      spawnPattern();
    }
    st.trainIn -= dz;
    if (st.trainIn <= 0 && !train.active) {
      startTrain();
      st.trainIn = 280 + Math.random() * 220;
    }
    st.powerIn -= dz;
    if (st.powerIn <= 0) {
      spawnPower();
      st.powerIn = 170 + Math.random() * 130;
    }

    const top = st.py + (st.slide > 0 ? 0.7 : 1.6);
    for (const ob of obstacles) {
      if (!ob.active) continue;
      ob.z += dz + (ob.kind === "train" ? TRAIN_SPEED * dt : 0);
      ob.obj.position.z = ob.z;
      const h = HIT[ob.kind];
      const zMin = ob.z - h.d;
      const zMax = ob.kind === "train" ? ob.z : ob.z + h.d;
      if (!ob.passed && zMin > 0.4) {
        ob.passed = true;
        // Close call: it went by in the next lane right after a lane change (or it was the train).
        const dx = Math.abs(LANES[ob.lane] - st.px);
        if (dx > 1.2 && dx < 2.6 && (st.laneT < 0.7 || ob.kind === "train")) {
          st.combo = st.comboT > 0 ? st.combo + 1 : 1;
          st.comboT = 3;
          st.bonus += 20 * st.combo;
          o.onEvent("near", st.combo);
        }
      }
      if (zMin > DESPAWN_Z) {
        ob.active = false;
        ob.obj.visible = false;
        if (ob.kind === "train") warn.visible = false;
        continue;
      }
      const hit = Math.abs(LANES[ob.lane] - st.px) < h.w + 0.32 && zMin < 0.3 && zMax > -0.3 && st.py < h.y1 && top > h.y0;
      if (!hit || st.fast > 0 || st.invuln > 0) continue;
      if (st.shield) {
        st.shield = false;
        st.invuln = 1;
        st.shake = o.reduced ? 0 : 0.35;
        if (ob.kind !== "train") {
          ob.active = false;
          ob.obj.visible = false;
          sparkles.burst(LANES[ob.lane], 1, ob.z, 18, haloColor.umbrella);
        }
        o.onEvent("hit");
        continue;
      }
      crash();
      return;
    }

    for (const c of coins) {
      if (c.pop > 0) {
        c.pop -= dt;
        c.z += dz * 0.2;
        continue;
      }
      if (!c.active) continue;
      c.z += dz;
      if (c.z > DESPAWN_Z) c.active = false;
      else if (Math.abs(c.x - st.px) < 0.8 && Math.abs(c.z) < 0.75 && c.y > st.py - 0.35 && c.y < top + 0.35) {
        c.active = false;
        c.pop = 0.2;
        st.coins += st.chai > 0 ? 2 : 1;
        sparkles.burst(c.x, c.y, c.z, 6);
        if (st.coinCueT <= 0) {
          o.onEvent("coin");
          st.coinCueT = 0.08;
        }
      }
    }
    for (const k of powerKinds) {
      const p = powers[k];
      if (!p.active) continue;
      p.z += dz;
      if (p.z > DESPAWN_Z) p.active = false;
      else if (Math.abs(LANES[p.lane] - st.px) < 0.85 && Math.abs(p.z) < 0.75 && st.py < 1.6) {
        p.active = false;
        if (k === "chai") st.chai = CHAI_S;
        if (k === "umbrella") st.shield = true;
        if (k === "fast") st.fast = FAST_S;
        sparkles.burst(LANES[p.lane], 1, p.z, 22, haloColor[k]);
        o.onEvent("power");
      }
      if (!p.active) powerObjs[k].visible = false;
    }

    const si = stageAt(st.distance);
    if (si !== st.stage) {
      st.stage = si;
      o.onEvent("stage", si);
    }

    st.hudT -= dt;
    if (st.hudT <= 0) {
      st.hudT = 0.1;
      hud();
    }
  };

  /* ------------------------------------------------ visuals, once per rendered frame */
  const camPos = new Vector3(2.4, 1.8, 4.5);
  const camLook = new Vector3(0, 1.1, -12);
  const tmpV = new Vector3();
  const tmpM = new Matrix4();
  const tmpQ = new Quaternion();
  const tmpS = new Vector3();
  const tmpE = new Vector3();
  const UP = new Vector3(0, 1, 0);
  let roll = 0;
  let fovNow = 62;
  let realT = 0;

  const updateAir = () => {
    const d = st.distance;
    const i = stageAt(d);
    const local = d % STAGE_M;
    const t = d < STAGE_M ? 1 : smooth(Math.min(1, local / 90));
    const prev = (i + 2) % 3;
    lerpPalette(pal, palettes[prev], palettes[i], t);
    const wanted = t > 0.5 ? i : prev;
    if (wanted !== envIndex) {
      envIndex = wanted;
      scene.environment = envs[wanted].texture;
    }
    const weight = (s: number) => (s === i ? t : s === prev ? 1 - t : 0);
    scene.environmentIntensity = 0.4 + 0.4 * (1 - pal.night);
    hemi.color.copy(pal.hemi);
    hemi.groundColor.copy(pal.fill);
    hemi.intensity = pal.hemiI;
    sun.color.copy(pal.sun).lerp(WHITE, 0.35);
    sun.intensity = pal.sunI;
    rim.intensity = pal.rimI;
    fog.color.copy(pal.horizon);
    fog.near = pal.fogNear;
    fog.far = pal.fogFar;
    renderer.toneMappingExposure = pal.exposure;
    scenery.setNight(pal.night);
    return { marine: weight(1), link: weight(2) };
  };

  const animateRunner = (dt: number) => {
    const airborne = st.py > 0;
    const sliding = st.slide > 0;
    st.slideAmt = damp(st.slideAmt, sliding ? 1 : 0, 18, dt);
    st.squash = Math.max(0, st.squash - dt * 6);
    const rate = mode === "idle" || mode === "frozen" ? 9 : 7 + st.speed * 0.3;
    if (mode !== "over") st.phase += dt * rate;
    const s = Math.sin(st.phase);
    const r = rig;
    r.root.position.set(st.px, st.py, 0);

    if (mode === "over") {
      // Knocked back: tips over toward the camera and settles.
      const k = Math.min(1, st.crashT / 0.5);
      r.body.rotation.set(1.25 * smooth(k), 0, 0.3 * k);
      r.body.position.set(0, 0.25 * Math.sin(k * Math.PI), 0.6 * k);
      r.legL.rotation.x = 0.9 * k;
      r.legR.rotation.x = 0.5 * k;
      r.armL.rotation.set(-2 * k, 0, -0.6 * k);
      r.armR.rotation.set(-2.2 * k, 0, 0.6 * k);
      return;
    }

    const bob = o.reduced || airborne || sliding ? 0 : Math.abs(s) * 0.07;
    const sl = st.slideAmt;
    // Lean into lane changes.
    const lateral = mode === "run" ? LANES[st.lane] - st.px : 0;
    r.root.rotation.set(0, lateral * 0.08, -lateral * 0.13);

    r.body.position.set(0, bob - sl * 0.45, 0);
    r.body.rotation.set(sl * 1.2, 0, 0);
    // Squash on landing, stretch while rising.
    const stretch = airborne && st.vy > 0 ? 0.08 : 0;
    const sq = st.squash * 0.2;
    r.body.scale.set(1 + sq * 0.7 - stretch * 0.4, 1 - sq + stretch, 1 + sq * 0.7 - stretch * 0.4);
    r.hips.rotation.x = -0.14 * (1 - sl);
    r.head.rotation.x = 0.1 - sl * 0.9;

    if (airborne) {
      r.legL.rotation.x = damp(r.legL.rotation.x, 0.9, 14, dt);
      r.legR.rotation.x = damp(r.legR.rotation.x, -0.25, 14, dt);
      r.armL.rotation.set(damp(r.armL.rotation.x, -2.3, 12, dt), 0, -0.35);
      r.armR.rotation.set(damp(r.armR.rotation.x, -2.0, 12, dt), 0, 0.35);
    } else {
      const amp = 0.9 * (1 - sl * 0.7);
      r.legL.rotation.x = s * amp + sl * 0.2;
      r.legR.rotation.x = -s * amp + sl * 0.2;
      r.armL.rotation.set(-s * 0.8 * (1 - sl) - sl * 0.6, 0, -0.12 - sl * 0.4);
      r.armR.rotation.set(s * 0.8 * (1 - sl) - sl * 0.6, 0, 0.12 + sl * 0.4);
    }
    r.umbrella.visible = st.shield;
  };

  const draw = (dt: number, simDt: number) => {
    realT += dt;
    const air = updateAir();
    animateRunner(simDt);

    blobs.begin();
    // The runner's shadow shrinks as they rise.
    const lift = Math.max(0.35, 1 - st.py * 0.3);
    blobs.add(st.px, 0.03, 0.05, 0.95 * lift, 1.1 * lift);

    let n = 0;
    for (const c of coins) {
      if (!c.active && c.pop <= 0) continue;
      let sc = 1;
      if (c.pop > 0) sc = c.pop > 0.08 ? 1 + (0.2 - c.pop) * 6 : (c.pop / 0.08) * 1.7;
      const yy = c.pop > 0 ? c.y + (0.2 - c.pop) * 3 : c.y + (o.reduced ? 0 : Math.sin(realT * 3 + c.z * 0.3) * 0.08);
      tmpE.set(c.x, yy, c.z);
      tmpQ.setFromAxisAngle(UP, o.reduced ? 0.6 : realT * 3 + c.z * 0.1).premultiply(COIN_TILT);
      tmpS.setScalar(sc);
      coinMesh.setMatrixAt(n++, tmpM.compose(tmpE, tmpQ, tmpS));
      if (c.active && c.y < 1.6 && c.z > -70) blobs.add(c.x, 0.03, c.z, 0.55, 0.55);
    }
    coinMesh.count = n;
    coinMesh.instanceMatrix.needsUpdate = true;

    for (const ob of obstacles) {
      if (!ob.active) continue;
      const [sx, sz] = SHADOW_SIZE[ob.kind];
      if (ob.kind === "train") {
        for (let i = 0; i < TRAIN_CARS; i++) blobs.add(LANES[ob.lane], 0.03, ob.z - CAR_LEN / 2 - i * (CAR_LEN + 0.15), sx, CAR_LEN + 1);
      } else blobs.add(LANES[ob.lane], 0.03, ob.z, sx, sz);
    }

    for (const k of powerKinds) {
      const p = powers[k];
      if (!p.active) continue;
      const g = powerObjs[k];
      g.position.set(LANES[p.lane], 1.05 + (o.reduced ? 0 : Math.sin(realT * 4) * 0.12), p.z);
      if (!o.reduced) g.children[0].rotation.y = realT * 2;
      const halo = g.children[1];
      halo.quaternion.copy(camera.quaternion);
      halo.scale.setScalar(o.reduced ? 1 : 1 + Math.sin(realT * 5) * 0.12);
      blobs.add(LANES[p.lane], 0.03, p.z, 0.7, 0.7);
    }
    blobs.end();

    track.update(st.distance);
    scenery.update(st.distance);
    if (warn.visible) warnMat.opacity = o.reduced ? 0.22 : 0.1 + 0.18 * Math.abs(Math.sin(realT * 9));
    cones.visible = tier !== "low" && pal.night > 0.15;

    /* camera: smoothed chase with look-ahead; a cinematic three-quarter view on the start screen */
    const eff = st.fast > 0 && mode === "run" ? st.speed * 1.5 : st.speed;
    const aspect = W / H;
    const back = aspect < 1 ? (1 - aspect) * 2.6 : 0;
    const idle = mode === "idle";
    if (idle) {
      const sway = o.reduced ? 0 : Math.sin(realT * 0.35) * 0.8;
      tmpV.set(st.px + 2.4 + sway, 1.7 + back * 0.3, 4.3 + back);
      camLook.set(st.px - 0.3, 1.15, -3);
    } else {
      // Portrait: a little further back and higher, looking down more, so all three lanes
      // fit the narrow view and the horizon sits in the upper third.
      tmpV.set(st.px * 0.6, 2.85 + st.py * 0.3 + back * 0.35, 6.2 - back * 0.6);
      camLook.set(st.px * 0.7, 1.0 - back * 0.2 + st.py * 0.25, -12 + back * 2.9);
    }
    if (mode === "over") tmpV.z -= Math.min(1, st.crashT) * 1.2;
    camPos.x = damp(camPos.x, tmpV.x, idle ? 2 : 9, dt);
    camPos.y = damp(camPos.y, tmpV.y, idle ? 2 : 6, dt);
    camPos.z = damp(camPos.z, tmpV.z, idle ? 2 : 6, dt);
    camera.position.copy(camPos);
    if (!o.reduced && mode === "run" && st.py === 0) camera.position.y += Math.sin(st.phase * 2) * 0.025;
    camera.lookAt(camLook);
    const lateralV = simDt > 0 ? (st.px - st.prevPx) / STEP : 0;
    roll = damp(roll, o.reduced ? 0 : Math.max(-0.06, Math.min(0.06, -lateralV * 0.006)), 8, dt);
    camera.rotateZ(roll);
    if (st.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * st.shake * 0.5;
      camera.position.y += (Math.random() - 0.5) * st.shake * 0.5;
      st.shake = Math.max(0, st.shake - dt * 1.6);
    }
    // FOV: keep ~74° across in any aspect (clamped), widening with speed.
    const baseV = (2 * Math.atan(Math.tan((74 * Math.PI) / 360) / aspect) * 180) / Math.PI;
    const fovTarget = Math.min(aspect < 1 ? 72 : 80, Math.max(50, baseV)) + (mode === "run" ? ((eff - START_SPEED) / (MAX_SPEED - START_SPEED)) * 9 : 0);
    fovNow = damp(fovNow, fovTarget, 3, dt);
    if (Math.abs(camera.fov - fovNow) > 0.01 || camera.aspect !== aspect) {
      camera.fov = fovNow;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }

    /* lights follow the runner */
    sunTarget.position.set(st.px, 0, -4);
    sun.position.copy(sunTarget.position).addScaledVector(KEY, 25);
    rimTarget.position.set(st.px, 1, 0);
    rim.position.set(st.px * 0.5, 4, -10);

    /* sky and air */
    sky.update(pal, camera.position);
    sunDisc.update(pal, camera.position);
    skyline.update(pal, camera.position, st.distance);
    sea.update(pal, camera.position, st.distance, realT);
    necklace.update(air.marine, camera.position);
    const dzFrame = mode === "run" ? eff * simDt : idle ? 7 * simDt : 0;
    cars.update(simDt, dzFrame, tier === "low" ? 0 : air.link);
    rain.update(simDt, mode === "run" ? eff : 6, air.link, camera.position);
    const windAmt = o.reduced || mode !== "run" ? 0 : Math.max(0, (eff - 15) / 20) + (st.fast > 0 ? 0.6 : 0);
    wind.update(simDt, eff, Math.min(1, windAmt), camera.position);
    sparkles.update(dt * (mode === "over" ? 0.4 : 1), dzFrame);
  };

  /* ------------------------------------------------ loop */
  let raf = 0;
  let last = 0;
  let acc = 0;
  let paused = false;
  let disposed = false;
  let slowFor = 0;
  let fpsFrames = 0;
  let fpsTime = 0;
  let fps = 0;
  let calls = 0;
  // Smoothed CPU ms per frame: simulation + scene update, and the render call itself.
  let cpuSim = 0;
  let cpuRender = 0;
  // Frame-time probe (auto tier): frames 30..150 of the start screen, about 2 s.
  let probeN = 0;
  let probeSum = 0;
  let probed = pref !== "auto";

  const stepDown = () => {
    const i = TIERS.indexOf(tier);
    if (i < TIERS.length - 1) applyTier(TIERS[i + 1]);
  };

  const render = () => {
    renderer.info.reset();
    if (composer) composer.render();
    else renderer.render(scene, camera);
    calls = renderer.info.render.calls;
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    // Slow motion for a moment after a crash (not under reduced motion).
    const slow = mode === "over" && !o.reduced && st.crashT < 0.6 ? 0.3 : 1;
    const simDt = dt * slow;
    const t0 = performance.now();
    acc += simDt;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    if (mode === "over") {
      st.crashT += simDt;
      if (!st.overSent && st.crashT >= (o.reduced ? 0.3 : 0.7)) {
        st.overSent = true;
        o.onOver({ distance: Math.floor(st.distance), coins: st.coins, score: score() });
      }
    }
    draw(dt, simDt);
    const t1 = performance.now();
    render();
    cpuSim = cpuSim * 0.95 + (t1 - t0) * 0.05;
    cpuRender = cpuRender * 0.95 + (performance.now() - t1) * 0.05;

    fpsFrames++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      fps = Math.round(fpsFrames / fpsTime);
      fpsFrames = 0;
      fpsTime = 0;
      o.canvas.dataset.fps = String(fps);
      o.canvas.dataset.calls = String(calls);
    }
    if (pref === "auto") {
      if (!probed && mode === "idle") {
        probeN++;
        if (probeN > 30) probeSum += dt;
        if (probeN >= 150) {
          probed = true;
          const avg = probeSum / 120;
          const i = TIERS.indexOf(tier);
          if (avg > 0.022) stepDown();
          else if (avg < 0.009 && !o.mobile && i > 0) applyTier(TIERS[i - 1]);
        }
      }
      // Mid-run: if frames stay slow for ~2 s, step down a tier (never up mid-run).
      if (mode === "run") {
        slowFor = dt > 0.025 ? slowFor + dt : Math.max(0, slowFor - dt * 2);
        if (slowFor > 2) {
          slowFor = 0;
          stepDown();
        }
      }
    }
    const settled = mode === "over" && st.crashT > 1.6 && st.shake === 0;
    if (!paused && !settled) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (raf || disposed || paused) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  applyTier(tier);
  hud();
  kick();

  return {
    /** The live start-screen scene (attract mode). */
    idle() {
      clearWorld();
      Object.assign(st, fresh(st.phase));
      mode = "idle";
      paused = false;
      kick();
    },
    /** A fresh run, held still (the countdown) until go(). */
    start() {
      clearWorld();
      Object.assign(st, fresh(st.phase));
      st.distance = o.startAt ?? 0;
      if (o.startAt) {
        // Dev/tests: get to the obstacles and the train quickly.
        st.trainIn = 12;
        st.sinceSpawn = 100;
      }
      st.stage = stageAt(st.distance);
      mode = "frozen";
      paused = false;
      acc = 0;
      hud();
      kick();
    },
    /** Starts (or continues) moving after the countdown. */
    go() {
      if (mode === "frozen") mode = "run";
      paused = false;
      kick();
    },
    /** Stops the loop entirely (pause menu, hidden tab, closed layer). */
    setPaused(on: boolean) {
      paused = on;
      if (on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (!on) kick();
    },
    /** Holds a running game still but keeps rendering (resume's countdown). */
    hold() {
      if (mode === "run") mode = "frozen";
      paused = false;
      kick();
    },
    act(a: DashAction) {
      if (mode !== "run") return;
      if (a === "left" || a === "right") {
        const next = Math.max(0, Math.min(2, st.lane + (a === "left" ? -1 : 1)));
        if (next !== st.lane) {
          st.lane = next;
          st.laneT = 0;
          o.onEvent("lane");
        }
      }
      if (a === "jump" && st.py === 0) {
        st.vy = JUMP_V;
        st.py = 0.0001;
        st.slide = 0;
        st.squash = 0.6;
        o.onEvent("jump");
      }
      if (a === "slide") {
        if (st.py > 0) st.vy = Math.min(st.vy, -14); // drop fast, then slide
        st.slide = SLIDE_S;
        o.onEvent("slide");
      }
    },
    setTier(p: TierPref) {
      pref = p;
      probed = p !== "auto";
      applyTier(p === "auto" ? guessTier(o.mobile) : p);
      kick();
    },
    resize(w: number, h: number) {
      W = w;
      H = h;
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      kick();
    },
    /** Tests: put a power-up just ahead in the runner's lane. */
    testPower(kind: PowerKind) {
      const p = powers[kind];
      Object.assign(p, { active: true, lane: st.lane, z: -25 });
      powerObjs[kind].visible = true;
    },
    stats: () => ({ fps, calls, tier, triangles: renderer.info.render.triangles, cpuSim: +cpuSim.toFixed(2), cpuRender: +cpuRender.toFixed(2) }),
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      composer?.dispose();
      bloom?.dispose();
      const seen = new Set<Material>();
      scene.traverse((n) => {
        const m = n as Mesh;
        m.geometry?.dispose();
        const list = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        list.forEach((x) => seen.add(x as Material));
      });
      seen.forEach((m) => {
        const t = m as unknown as Record<string, Texture | null | undefined>;
        for (const key of ["map", "emissiveMap", "normalMap"]) t[key]?.dispose?.();
        m.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
      [track, scenery, sea, rain, wind, sparkles, blobs].forEach((x) => x.dispose());
      envs.forEach((e) => e.dispose());
      tex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

export type Dash = ReturnType<typeof createDash>;
