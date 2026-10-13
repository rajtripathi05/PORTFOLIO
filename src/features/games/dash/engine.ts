/**
 * Mumbai Local Dash: the three.js side. Imported only by LocalDash.tsx, so three.js stays
 * in the game's lazy chunk (scripts/check-three.mjs).
 *
 * Everything is boxes, cylinders and planes in flat token colours. Each obstacle is one
 * mesh (parts merged, vertex colours); repeating scenery is instanced and scrolls by
 * shifting its group by `distance % period`, so nothing is rebuilt per frame. No shadows,
 * DPR ≤ 1.5 (1 on phones), fixed 120 Hz simulation step, one-time quality drop if frames
 * stay slow for 2 s.
 */
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const DASH_TOKENS = [
  "dash-track", "dash-sleeper", "dash-rail",
  "dash-dadar-sky", "dash-platform", "dash-edge-yellow", "dash-edge-black", "dash-pillar", "dash-roof", "dash-board", "dash-board-ink",
  "dash-marine-sky", "dash-sea", "dash-promenade", "dash-road", "dash-lamp-pole", "dash-lamp", "dash-building",
  "dash-link-sky", "dash-deck", "dash-tower", "dash-cable",
  "dash-rick-body", "dash-rick-roof", "dash-wheel", "dash-cart", "dash-barrier", "dash-barrier-ink",
  "dash-train", "dash-train-stripe", "dash-window", "dash-warn",
  "dash-shirt", "dash-pants", "dash-skin", "dash-hair",
  "dash-chai-glass", "dash-chai", "dash-umbrella", "dash-handle",
  "vp-bun", "vp-patty"
] as const;
export type DashColors = Record<(typeof DASH_TOKENS)[number], string>;

export interface DashHud {
  distance: number;
  coins: number;
  /** Seconds left. */
  chai: number;
  fast: number;
  shield: boolean;
  stage: string;
}
export type DashAction = "left" | "right" | "jump" | "slide";
export type DashCue = "coin" | "power" | "horn" | "hit" | "crash";

export interface DashOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  colors: DashColors;
  reduced: boolean;
  mobile: boolean;
  onHud: (h: DashHud) => void;
  onOver: (r: { distance: number; coins: number }) => void;
  onCue: (c: DashCue) => void;
  /** Dev only: start this many metres in (to look at later stages). */
  startAt?: number;
}

const LANES = [-2, 0, 2];
const STEP = 1 / 120;
const SPAWN_Z = -100;
const DESPAWN_Z = 12;
const START_SPEED = 12;
const MAX_SPEED = 30;
const ACCEL = 0.22; // m/s per second
const GRAVITY = 26;
const JUMP_V = 9.2;
const SLIDE_S = 0.65;
const TRAIN_SPEED = 20;
const STAGE_M = 600;
const STAGES = ["Dadar", "Marine Drive", "Sea Link"] as const;

/* ------------------------------------------------------------ geometry */

type V3 = [number, number, number];
type Part = [BufferGeometry, string, V3, V3?];

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, seg = 10) => new CylinderGeometry(rt, rb, h, seg);

/** Merges coloured parts into one geometry with vertex colours. */
const build = (parts: Part[]): BufferGeometry => {
  const geos = parts.map(([g, color, [x, y, z], r]) => {
    const gg = g.index ? g.toNonIndexed() : g.clone();
    g.dispose();
    if (r) gg.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
    gg.translate(x, y, z);
    const c = new Color(color);
    const n = gg.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    gg.setAttribute("color", new BufferAttribute(arr, 3));
    gg.deleteAttribute("uv");
    return gg;
  });
  const merged = mergeGeometries(geos)!;
  geos.forEach((g) => g.dispose());
  return merged;
};

/** A thin box from a to b (cables). */
const beam = (a: V3, b: V3, t: number): BufferGeometry => {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const g = box(t, t, va.distanceTo(vb));
  const m = new Matrix4().lookAt(va, vb, new Vector3(0, 1, 0));
  const q = new Quaternion().setFromRotationMatrix(m);
  g.applyQuaternion(q);
  const mid = va.add(vb).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  return g;
};

const textTexture = (lines: string[], bg: string, ink: string, w = 512, h = 160): Texture => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const size = lines.length > 1 ? h * 0.36 : h * 0.5;
  g.font = `700 ${size}px "Nirmala UI", "Noto Sans Devanagari", Mangal, system-ui, sans-serif`;
  lines.forEach((l, i) => g.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1) + (lines.length > 1 ? (i ? -6 : 6) : 0)));
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

/* ------------------------------------------------------------ engine */

type Kind = "rickshaw" | "cart" | "barrier" | "train";
interface Obstacle {
  kind: Kind;
  mesh: Object3D;
  active: boolean;
  lane: number;
  z: number;
}
interface Item {
  active: boolean;
  lane: number;
  z: number;
  y: number;
}
type PowerKind = "chai" | "umbrella" | "fast";

// Collision boxes (half width, y range, half depth; trains extend backwards from z).
const HIT: Record<Kind, { w: number; y0: number; y1: number; d: number }> = {
  rickshaw: { w: 0.75, y0: 0, y1: 1.2, d: 1.15 },
  cart: { w: 0.7, y0: 0, y1: 0.95, d: 0.8 },
  barrier: { w: 0.95, y0: 1.05, y1: 1.65, d: 0.1 },
  train: { w: 0.95, y0: 0, y1: 3, d: 18.6 }
};

export function createDash(o: DashOptions) {
  const C = o.colors;
  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: !o.mobile, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.mobile ? 1 : 1.5));
  renderer.setSize(o.width, o.height, false);

  const scene = new Scene();
  const camera = new PerspectiveCamera(66, o.width / o.height, 0.1, 260);
  const CAM = new Vector3(0, 3.4, 6.8);
  camera.position.copy(CAM);
  camera.lookAt(0, 1.2, -8);
  const camBase = camera.quaternion.clone();

  scene.add(new HemisphereLight(0xffffff, 0x8a8070, 1.1));
  scene.add(new AmbientLight(0xffffff, 0.25));
  const sun = new DirectionalLight(0xffffff, 1.3);
  sun.position.set(4, 9, 5);
  scene.add(sun);

  const vmat = new MeshLambertMaterial({ vertexColors: true });
  const lambert = (c: string) => new MeshLambertMaterial({ color: c });
  const basic = (c: string) => new MeshBasicMaterial({ color: c });
  const textures: Texture[] = [];

  /* track: ground, rails (static), sleepers (periodic) */
  const ground = new Mesh(new PlaneGeometry(60, 270), lambert(C["dash-track"]));
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -120;
  scene.add(ground);
  scene.add(
    new Mesh(
      build(LANES.flatMap((x) => [-0.72, 0.72].map((dx): Part => [box(0.09, 0.12, 270), C["dash-rail"], [x + dx, 0.1, -120]]))),
      vmat
    )
  );
  const SLEEPER_GAP = 1.2;
  const sleeperCount = Math.ceil(130 / SLEEPER_GAP);
  const sleepers = new InstancedMesh(box(1.8, 0.06, 0.3), lambert(C["dash-sleeper"]), sleeperCount * 3);
  const tmp = new Object3D();
  LANES.forEach((x, li) => {
    for (let i = 0; i < sleeperCount; i++) {
      tmp.position.set(x, 0.03, 8 - i * SLEEPER_GAP);
      tmp.updateMatrix();
      sleepers.setMatrixAt(li * sleeperCount + i, tmp.matrix);
    }
  });
  const sleeperGroup = new Group();
  sleeperGroup.add(sleepers);
  scene.add(sleeperGroup);

  /* lane warning for trains */
  const warnMat = new MeshBasicMaterial({ color: C["dash-warn"], transparent: true, opacity: 0 });
  const warn = new Mesh(new PlaneGeometry(1.9, 110), warnMat);
  warn.rotation.x = -Math.PI / 2;
  warn.position.set(0, 0.05, -50);
  warn.visible = false;
  scene.add(warn);

  /* player (origin at the feet, running away from the camera) */
  const player = new Mesh(
    build([
      [box(0.18, 0.6, 0.2), C["dash-pants"], [-0.12, 0.3, 0]],
      [box(0.18, 0.6, 0.2), C["dash-pants"], [0.12, 0.3, 0]],
      [box(0.55, 0.62, 0.3), C["dash-shirt"], [0, 0.9, 0]],
      [box(0.14, 0.5, 0.18), C["dash-shirt"], [-0.36, 0.95, 0]],
      [box(0.14, 0.5, 0.18), C["dash-shirt"], [0.36, 0.95, 0]],
      [box(0.34, 0.34, 0.32), C["dash-skin"], [0, 1.4, 0]],
      [box(0.36, 0.12, 0.34), C["dash-hair"], [0, 1.6, 0]]
    ]),
    vmat
  );
  scene.add(player);

  const umbrellaGeo = () =>
    build([
      [cyl(0.02, 0.62, 0.32, 8), C["dash-umbrella"], [0, 0.55, 0]],
      [cyl(0.025, 0.025, 1, 6), C["dash-handle"], [0, 0, 0]]
    ]);
  const shield = new Mesh(umbrellaGeo(), vmat);
  shield.position.set(0, 1.55, 0);
  shield.visible = false;
  player.add(shield);

  /* obstacles: pooled single meshes */
  const wheel = (x: number, y: number, z: number, r: number): Part => [cyl(r, r, 0.16, 12), C["dash-wheel"], [x, y, z], [0, 0, Math.PI / 2]];
  const geoFor: Record<Exclude<Kind, "train">, () => BufferGeometry> = {
    rickshaw: () =>
      build([
        [box(1.4, 0.55, 2.0), C["dash-rick-body"], [0, 0.55, 0]],
        [box(1.45, 0.5, 1.6), C["dash-rick-roof"], [0, 1.1, 0.1]],
        [box(0.6, 0.4, 0.4), C["dash-rick-body"], [0, 0.55, -1.1]],
        wheel(-0.65, 0.25, 0.6, 0.25),
        wheel(0.65, 0.25, 0.6, 0.25),
        wheel(0, 0.25, -1.1, 0.25)
      ]),
    cart: () =>
      build([
        [box(1.3, 0.12, 1.5), C["dash-cart"], [0, 0.72, 0]],
        [box(1.3, 0.25, 0.08), C["dash-cart"], [0, 0.88, 0.72]],
        [box(1.3, 0.25, 0.08), C["dash-cart"], [0, 0.88, -0.72]],
        [box(0.06, 0.06, 0.8), C["dash-cart"], [-0.5, 0.75, 1.1]],
        [box(0.06, 0.06, 0.8), C["dash-cart"], [0.5, 0.75, 1.1]],
        wheel(-0.7, 0.35, 0, 0.35),
        wheel(0.7, 0.35, 0, 0.35)
      ]),
    barrier: () =>
      build([
        [box(0.12, 1.8, 0.12), C["dash-barrier"], [-0.95, 0.9, 0]],
        [box(0.12, 1.8, 0.12), C["dash-barrier"], [0.95, 0.9, 0]],
        [box(1.95, 0.52, 0.1), C["dash-barrier"], [0, 1.35, 0]]
      ])
  };
  const signTex = textTexture(["MIND THE GAP"], C["dash-barrier"], C["dash-barrier-ink"], 512, 128);
  textures.push(signTex);
  const signMat = new MeshBasicMaterial({ map: signTex });
  const signGeo = new PlaneGeometry(1.8, 0.45);

  const obstacles: Obstacle[] = [];
  const geoCache = new Map<Kind, BufferGeometry>();
  for (const kind of ["rickshaw", "cart", "barrier"] as const) {
    geoCache.set(kind, geoFor[kind]());
    for (let i = 0; i < 4; i++) {
      const m = new Mesh(geoCache.get(kind)!, vmat);
      if (kind === "barrier") {
        const sign = new Mesh(signGeo, signMat);
        sign.position.set(0, 1.35, 0.06);
        m.add(sign);
      }
      m.visible = false;
      scene.add(m);
      obstacles.push({ kind, mesh: m, active: false, lane: 0, z: 0 });
    }
  }
  const trainParts: Part[] = [];
  for (let i = 0; i < 3; i++) {
    const cz = -(3 + i * 6.3);
    trainParts.push(
      [box(1.9, 2.6, 6), C["dash-train"], [0, 1.5, cz]],
      [box(1.94, 0.32, 6), C["dash-train-stripe"], [0, 1.0, cz]],
      [box(1.95, 0.5, 5.2), C["dash-window"], [0, 2.05, cz]]
    );
  }
  trainParts.push(
    [box(1.2, 0.7, 0.05), C["dash-window"], [0, 2.1, 0.01]],
    [box(0.25, 0.18, 0.06), C["dash-lamp"], [-0.6, 0.75, 0.02]],
    [box(0.25, 0.18, 0.06), C["dash-lamp"], [0.6, 0.75, 0.02]]
  );
  const trainMesh = new Mesh(build(trainParts), vmat);
  trainMesh.visible = false;
  scene.add(trainMesh);
  const train: Obstacle = { kind: "train", mesh: trainMesh, active: false, lane: 0, z: 0 };
  obstacles.push(train);

  /* vada pav coins (instanced) and power-ups */
  const MAX_COINS = 60;
  const coinMesh = new InstancedMesh(
    build([
      [cyl(0.3, 0.3, 0.1, 14), C["vp-bun"], [0, -0.08, 0]],
      [cyl(0.35, 0.35, 0.08, 14), C["vp-patty"], [0, 0, 0]],
      [cyl(0.24, 0.3, 0.15, 14), C["vp-bun"], [0, 0.1, 0]]
    ]),
    vmat,
    MAX_COINS
  );
  coinMesh.count = 0;
  scene.add(coinMesh);
  const coins: Item[] = Array.from({ length: MAX_COINS }, () => ({ active: false, lane: 0, z: 0, y: 0 }));

  const powerMeshes: Record<PowerKind, Mesh> = {
    chai: new Mesh(
      build([
        [cyl(0.17, 0.13, 0.16, 12), C["dash-chai-glass"], [0, 0.12, 0]],
        [cyl(0.15, 0.12, 0.24, 12), C["dash-chai"], [0, -0.07, 0]]
      ]),
      vmat
    ),
    umbrella: new Mesh(umbrellaGeo(), vmat),
    fast: new Mesh(
      build([
        [box(0.5, 0.42, 0.9), C["dash-train"], [0, 0, 0]],
        [box(0.52, 0.08, 0.9), C["dash-train-stripe"], [0, -0.08, 0]],
        [box(0.53, 0.12, 0.7), C["dash-window"], [0, 0.1, 0]]
      ]),
      vmat
    )
  };
  const powers: Record<PowerKind, Item> = {
    chai: { active: false, lane: 0, z: 0, y: 0.9 },
    umbrella: { active: false, lane: 0, z: 0, y: 0.9 },
    fast: { active: false, lane: 0, z: 0, y: 0.9 }
  };
  for (const m of Object.values(powerMeshes)) {
    m.visible = false;
    scene.add(m);
  }

  /* ---------------------------------------------------------- stages */

  interface Stage {
    group: Group;
    periodic: { obj: Object3D; period: number }[];
    extras: Object3D[];
    sky: string;
    ground: string;
    /** Width of the track bed (m); narrower where the sea should show. */
    groundWidth: number;
  }
  const periodicGroup = (period: number, count: number, place: (i: number, t: Object3D) => void, geo: BufferGeometry, mat: Material, stage: Stage, extra = false) => {
    const mesh = new InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) {
      tmp.position.set(0, 0, 0);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(1, 1, 1);
      place(i, tmp);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    const g = new Group();
    g.add(mesh);
    stage.group.add(g);
    stage.periodic.push({ obj: g, period });
    if (extra) stage.extras.push(g);
    return mesh;
  };

  const buildStage = (i: number): Stage => {
    const s: Stage = { group: new Group(), periodic: [], extras: [], sky: C["dash-dadar-sky"], ground: C["dash-track"], groundWidth: 60 };
    if (i === 0) {
      // Dadar platform: yellow-black edge, pillars, roof and station boards.
      s.group.add(
        new Mesh(
          build(
            [-1, 1].flatMap((side): Part[] => [
              [box(5, 0.9, 270), C["dash-platform"], [side * 5.6, 0.45, -120]],
              [box(0.32, 0.02, 270), C["dash-edge-black"], [side * 3.27, 0.91, -120]],
              [box(5, 0.15, 270), C["dash-roof"], [side * 5.6, 4.2, -120]]
            ])
          ),
          vmat
        )
      );
      periodicGroup(2, 2 * 66, (k, t) => t.position.set(k % 2 ? 3.27 : -3.27, 0.925, 8 - Math.floor(k / 2) * 2), box(0.32, 0.02, 1), lambert(C["dash-edge-yellow"]), s);
      periodicGroup(8, 2 * 17, (k, t) => t.position.set(k % 2 ? 6 : -6, 2.55, 8 - Math.floor(k / 2) * 8), cyl(0.18, 0.18, 3.3), lambert(C["dash-pillar"]), s);
      const tex = textTexture(["दादर", "DADAR"], C["dash-board"], C["dash-board-ink"], 384, 200);
      textures.push(tex);
      periodicGroup(24, 2 * 6, (k, t) => t.position.set(k % 2 ? 4.6 : -4.6, 3.3, 4 - Math.floor(k / 2) * 24), new PlaneGeometry(1.5, 0.78), new MeshBasicMaterial({ map: tex }), s);
    } else if (i === 1) {
      // Marine Drive at dusk: sea, promenade, street lamps, and the Queen's Necklace far off.
      s.sky = C["dash-marine-sky"];
      s.groundWidth = 19;
      const sea = new Mesh(new PlaneGeometry(200, 300), lambert(C["dash-sea"]));
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(-105, -0.3, -120);
      s.group.add(sea);
      s.group.add(
        new Mesh(
          build([
            [box(0.7, 0.6, 270), C["dash-promenade"], [-3.9, 0.3, -120]],
            [box(3, 0.3, 270), C["dash-promenade"], [-5.6, 0.15, -120]],
            [box(6, 0.05, 270), C["dash-road"], [6.5, 0.03, -120]]
          ]),
          vmat
        )
      );
      periodicGroup(12, 11, (k, t) => t.position.set(-4.6, 1.6, 8 - k * 12), cyl(0.06, 0.08, 3.2, 6), lambert(C["dash-lamp-pole"]), s);
      periodicGroup(12, 11, (k, t) => t.position.set(-4.25, 3.2, 8 - k * 12), box(0.6, 0.12, 0.28), basic(C["dash-lamp"]), s);
      const necklace = new InstancedMesh(box(0.5, 0.5, 0.5), basic(C["dash-lamp"]), 40);
      for (let k = 0; k < 40; k++) {
        const u = k / 39;
        tmp.position.set(-30 - u * 70, 0.6, -190 + u * 150 - Math.sin(u * Math.PI) * 30);
        tmp.updateMatrix();
        necklace.setMatrixAt(k, tmp.matrix);
      }
      s.group.add(necklace);
      s.extras.push(necklace);
      const heights = [9, 14, 7, 18, 11, 6, 15, 10];
      periodicGroup(64, 2 * 8, (k, t) => {
        const h = heights[k % 8];
        t.position.set(12 + (k % 3), h / 2, 8 - (k % 8) * 8 - Math.floor(k / 8) * 64);
        t.scale.set(5, h, 6);
      }, box(1, 1, 1), lambert(C["dash-building"]), s, true);
    } else {
      // Bandra-Worli Sea Link: water both sides, cable-stay towers and fanned stays.
      s.sky = C["dash-link-sky"];
      s.ground = C["dash-deck"];
      s.groundWidth = 7.6;
      const sea = new Mesh(new PlaneGeometry(400, 400), lambert(C["dash-sea"]));
      sea.rotation.x = -Math.PI / 2;
      sea.position.set(0, -3, -120);
      s.group.add(sea);
      s.group.add(
        new Mesh(
          build([
            [box(0.4, 0.9, 270), C["dash-deck"], [-3.6, 0.45, -120]],
            [box(0.4, 0.9, 270), C["dash-deck"], [3.6, 0.45, -120]],
            [box(1.2, 3, 270), C["dash-deck"], [-4.4, -1.4, -120]],
            [box(1.2, 3, 270), C["dash-deck"], [4.4, -1.4, -120]]
          ]),
          vmat
        )
      );
      // One tower: two legs leaning in to an inverted Y, then a mast.
      const towerGeo = build([
        [box(0.5, 14, 0.7), C["dash-tower"], [-0.9, 7, 0], [0, 0, -0.07]],
        [box(0.5, 14, 0.7), C["dash-tower"], [0.9, 7, 0], [0, 0, 0.07]],
        [box(0.6, 9, 0.7), C["dash-tower"], [0, 18, 0]]
      ]);
      const cableGeo = mergeGeometries(
        [-1, 1].flatMap((dir) => [0, 1, 2, 3, 4].map((k) => beam([0, 21.5 - k * 1.2, 0], [0, 0.9, dir * (8 + k * 7)], 0.06)))
      )!;
      periodicGroup(90, 2 * 3, (k, t) => t.position.set(k % 2 ? 5.2 : -5.2, 0, -20 - Math.floor(k / 2) * 90), towerGeo, vmat, s);
      periodicGroup(90, 2 * 3, (k, t) => t.position.set(k % 2 ? 5.2 : -5.2, 0, -20 - Math.floor(k / 2) * 90), cableGeo, lambert(C["dash-cable"]), s, true);
    }
    return s;
  };

  const disposeObject = (obj: Object3D) =>
    obj.traverse((n) => {
      const m = n as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mt) => mt !== vmat && mt.dispose());
    });

  let stage: Stage | null = null;
  let stageIndex = -1;
  let lowQuality = false;
  const setStage = (i: number) => {
    if (stage) {
      scene.remove(stage.group);
      disposeObject(stage.group);
    }
    stage = buildStage(i);
    stageIndex = i;
    scene.add(stage.group);
    scene.background = new Color(stage.sky);
    scene.fog = lowQuality ? null : new Fog(stage.sky, 45, 115);
    (ground.material as MeshLambertMaterial).color.set(stage.ground);
    ground.scale.x = stage.groundWidth / 60;
    stage.extras.forEach((e) => (e.visible = !lowQuality));
  };

  /* ---------------------------------------------------------- state */

  const st = {
    over: false,
    t: 0,
    speed: START_SPEED,
    distance: 0,
    coins: 0,
    lane: 1,
    px: 0,
    py: 0,
    vy: 0,
    slide: 0,
    chai: 0,
    fast: 0,
    shield: false,
    invuln: 0,
    shake: 0,
    sinceSpawn: 0,
    trainIn: 220,
    warnT: 0,
    powerIn: 160,
    hudT: 0,
    coinCueT: 0
  };

  const reset = () => {
    Object.assign(st, {
      over: false, t: 0, speed: START_SPEED, distance: 0, coins: 0, lane: 1, px: 0, py: 0, vy: 0, slide: 0,
      chai: 0, fast: 0, shield: false, invuln: 0, shake: 0, sinceSpawn: 0, trainIn: 220, warnT: 0, powerIn: 160, hudT: 0
    });
    obstacles.forEach((ob) => {
      ob.active = false;
      ob.mesh.visible = false;
    });
    coins.forEach((c) => (c.active = false));
    (Object.keys(powers) as PowerKind[]).forEach((k) => {
      powers[k].active = false;
      powerMeshes[k].visible = false;
    });
    warn.visible = false;
    st.distance = o.startAt ?? 0;
    if (o.startAt) st.trainIn = 40; // dev: see the train sooner
    const si = Math.floor(st.distance / STAGE_M) % STAGES.length;
    if (stageIndex !== si) setStage(si);
    hud();
  };

  const hud = () =>
    o.onHud({
      distance: Math.floor(st.distance),
      coins: st.coins,
      chai: Math.max(0, st.chai),
      fast: Math.max(0, st.fast),
      shield: st.shield,
      stage: STAGES[Math.max(0, stageIndex)]
    });

  /* spawning */
  const trainLane = () => (train.active ? train.lane : -1);
  const freeLanes = () => [0, 1, 2].filter((l) => l !== trainLane());
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

  const spawnObstacle = (kind: Exclude<Kind, "train">, lane: number) => {
    const ob = obstacles.find((x) => x.kind === kind && !x.active);
    if (!ob) return;
    ob.active = true;
    ob.lane = lane;
    ob.z = SPAWN_Z;
    ob.mesh.position.set(LANES[lane], 0, ob.z);
    ob.mesh.visible = true;
  };
  const spawnCoins = (lane: number, n: number, arc = false) => {
    for (let k = 0; k < n; k++) {
      const c = coins.find((x) => !x.active);
      if (!c) return;
      c.active = true;
      c.lane = lane;
      c.z = SPAWN_Z - k * 2;
      const u = n > 1 ? k / (n - 1) : 0.5;
      c.y = arc ? 0.9 + Math.sin(u * Math.PI) * 1.3 : 0.8;
    }
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
      if (Math.random() < 0.5) spawnCoins(pick(lanes.filter((x) => x !== l)), 5);
    } else if (r < 0.6) {
      const [a, b] = lanes.sort(() => Math.random() - 0.5);
      spawnObstacle(randomKind(), a);
      spawnObstacle(randomKind(), b);
    } else if (r < 0.85) {
      spawnCoins(pick(lanes), 6);
    } else {
      const l = pick(lanes);
      spawnObstacle("rickshaw", l);
      // An arc of coins over the rickshaw: jump to collect.
      for (let k = 0; k < 5; k++) {
        const c = coins.find((x) => !x.active);
        if (!c) break;
        Object.assign(c, { active: true, lane: l, z: SPAWN_Z + 4 - k * 2, y: 1.2 + Math.sin((k / 4) * Math.PI) * 1.1 });
      }
    }
  };

  const startTrain = () => {
    const lane = pick([0, 1, 2]);
    // Clear that lane ahead so the train never overlaps a parked obstacle.
    obstacles.forEach((ob) => {
      if (ob.active && ob.lane === lane && ob.z < 0) {
        ob.active = false;
        ob.mesh.visible = false;
      }
    });
    const eff = st.fast > 0 ? st.speed * 1.5 : st.speed;
    train.active = true;
    train.lane = lane;
    train.z = -(eff + TRAIN_SPEED) * 1.5; // reaches the player in ~1.5 s
    trainMesh.position.set(LANES[lane], 0, train.z);
    trainMesh.visible = true;
    warn.position.x = LANES[lane];
    warn.visible = true;
    st.warnT = 1.5;
    o.onCue("horn");
  };

  const spawnPower = () => {
    const kind = pick<PowerKind>(["chai", "umbrella", "fast"]);
    const p = powers[kind];
    if (p.active) return;
    p.active = true;
    p.lane = pick(freeLanes());
    p.z = SPAWN_Z;
    powerMeshes[kind].visible = true;
  };

  /* simulation */
  const step = (dt: number) => {
    if (st.over) return;
    st.t += dt;
    st.speed = Math.min(MAX_SPEED, st.speed + ACCEL * dt);
    const eff = st.fast > 0 ? st.speed * 1.5 : st.speed;
    const dz = eff * dt;
    st.distance += dz;

    st.px += (LANES[st.lane] - st.px) * Math.min(1, dt * 16);
    if (st.py > 0 || st.vy > 0) {
      st.vy -= GRAVITY * dt;
      st.py = Math.max(0, st.py + st.vy * dt);
      if (st.py === 0) st.vy = 0;
    }
    st.slide = Math.max(0, st.slide - dt);
    st.chai -= dt;
    st.fast -= dt;
    st.invuln -= dt;
    st.warnT = Math.max(0, st.warnT - dt);
    st.coinCueT -= dt;

    st.sinceSpawn += dz;
    if (st.sinceSpawn >= Math.max(13, 26 - st.speed * 0.4)) {
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
      ob.mesh.position.z = ob.z;
      const h = HIT[ob.kind];
      const zMin = ob.z - h.d;
      const zMax = ob.kind === "train" ? ob.z : ob.z + h.d;
      if (zMin > DESPAWN_Z) {
        ob.active = false;
        ob.mesh.visible = false;
        if (ob.kind === "train") warn.visible = false;
        continue;
      }
      const hit =
        Math.abs(LANES[ob.lane] - st.px) < h.w + 0.35 && zMin < 0.3 && zMax > -0.3 && st.py < h.y1 && top > h.y0;
      if (!hit || st.fast > 0 || st.invuln > 0) continue;
      if (st.shield) {
        st.shield = false;
        st.invuln = 1;
        st.shake = 0.35;
        if (ob.kind !== "train") {
          ob.active = false;
          ob.mesh.visible = false;
        }
        o.onCue("hit");
        continue;
      }
      st.over = true;
      running = false; // the loop renders until the shake settles, then stops
      st.shake = 0.6;
      o.onCue("crash");
      hud();
      o.onOver({ distance: Math.floor(st.distance), coins: st.coins });
      return;
    }

    for (const c of coins) {
      if (!c.active) continue;
      c.z += dz;
      if (c.z > DESPAWN_Z) c.active = false;
      else if (Math.abs(LANES[c.lane] - st.px) < 0.8 && Math.abs(c.z) < 0.7 && c.y > st.py - 0.3 && c.y < top + 0.3) {
        c.active = false;
        st.coins += st.chai > 0 ? 2 : 1;
        if (st.coinCueT <= 0) {
          o.onCue("coin");
          st.coinCueT = 0.08;
        }
      }
    }
    for (const k of Object.keys(powers) as PowerKind[]) {
      const p = powers[k];
      if (!p.active) continue;
      p.z += dz;
      if (p.z > DESPAWN_Z) p.active = false;
      else if (Math.abs(LANES[p.lane] - st.px) < 0.8 && Math.abs(p.z) < 0.7 && st.py < 1.4) {
        p.active = false;
        if (k === "chai") st.chai = 8;
        if (k === "umbrella") st.shield = true;
        if (k === "fast") st.fast = 5;
        o.onCue("power");
      }
      if (!p.active) powerMeshes[k].visible = false;
    }

    const si = Math.floor(st.distance / STAGE_M) % STAGES.length;
    if (si !== stageIndex) setStage(si);

    st.hudT -= dt;
    if (st.hudT <= 0) {
      st.hudT = 0.1;
      hud();
    }
  };

  /* visuals (once per rendered frame) */
  const draw = (dt: number) => {
    player.position.set(st.px, st.py, 0);
    const running = !st.over && st.py === 0 && st.slide === 0;
    player.scale.set(1, st.slide > 0 ? 0.45 : 1, 1);
    if (running && !o.reduced) player.position.y = Math.abs(Math.sin(st.t * 13)) * 0.07;
    player.rotation.x = st.slide > 0 ? -0.25 : 0;
    shield.visible = st.shield;

    let n = 0;
    for (const c of coins) {
      if (!c.active) continue;
      tmp.position.set(LANES[c.lane], c.y, c.z);
      tmp.rotation.set(0.5, o.reduced ? 0 : st.t * 3, 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      coinMesh.setMatrixAt(n++, tmp.matrix);
    }
    coinMesh.count = n;
    coinMesh.instanceMatrix.needsUpdate = true;
    for (const k of Object.keys(powers) as PowerKind[]) {
      const p = powers[k];
      if (!p.active) continue;
      const m = powerMeshes[k];
      m.position.set(LANES[p.lane], p.y + (o.reduced ? 0 : Math.sin(st.t * 4) * 0.12), p.z);
      if (!o.reduced) m.rotation.y = st.t * 2;
    }

    sleeperGroup.position.z = st.distance % SLEEPER_GAP;
    stage?.periodic.forEach((p) => (p.obj.position.z = st.distance % p.period));

    if (warn.visible) warnMat.opacity = o.reduced ? 0.35 : 0.22 + 0.22 * Math.abs(Math.sin(st.t * 10));

    camera.position.set(CAM.x + st.px * 0.35, CAM.y, CAM.z);
    camera.quaternion.copy(camBase);
    if (st.shake > 0) {
      if (!o.reduced) {
        camera.position.x += (Math.random() - 0.5) * st.shake;
        camera.position.y += (Math.random() - 0.5) * st.shake;
      }
      st.shake = Math.max(0, st.shake - dt * 1.5);
    }
  };

  /* loop */
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;
  let slowFor = 0;
  let disposed = false;

  const degrade = () => {
    lowQuality = true;
    scene.fog = null;
    stage?.extras.forEach((e) => (e.visible = false));
    renderer.setPixelRatio(1);
    o.canvas.dataset.quality = "low";
  };

  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (running) {
      acc += dt;
      while (acc >= STEP) {
        step(STEP);
        acc -= STEP;
      }
      // Average frame time over ~2 s; drop quality once if it stays above 25 ms.
      slowFor = dt > 0.025 ? slowFor + dt : Math.max(0, slowFor - dt * 2);
      if (!lowQuality && slowFor > 2) degrade();
    }
    draw(dt);
    renderer.render(scene, camera);
    if (running || st.shake > 0) raf = requestAnimationFrame(frame);
    else raf = 0;
  };
  const kick = () => {
    if (raf || disposed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  setStage(0);
  o.canvas.dataset.quality = "high";
  hud();
  kick();

  return {
    /** Starts a fresh run. */
    start() {
      reset();
      running = true;
      acc = 0;
      kick();
    },
    setRunning(on: boolean) {
      running = on && !st.over;
      kick();
    },
    act(a: DashAction) {
      if (!running || st.over) return;
      if (a === "left") st.lane = Math.max(0, st.lane - 1);
      if (a === "right") st.lane = Math.min(2, st.lane + 1);
      if (a === "jump" && st.py === 0) {
        st.vy = JUMP_V;
        st.py = 0.0001;
        st.slide = 0;
      }
      if (a === "slide") {
        if (st.py > 0) st.vy = Math.min(st.vy, -12); // drop fast, then slide
        st.slide = SLIDE_S;
      }
    },
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      kick();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      if (stage) disposeObject(stage.group);
      scene.traverse((n) => {
        const m = n as Mesh;
        m.geometry?.dispose();
      });
      [vmat, warnMat, signMat, ...Object.values(powerMeshes).map((m) => m.material as Material)].forEach((m) => m.dispose());
      (ground.material as Material).dispose();
      (sleepers.material as Material).dispose();
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

export type Dash = ReturnType<typeof createDash>;
