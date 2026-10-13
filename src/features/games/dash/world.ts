/**
 * The world around the track: sky dome, skyline, track, chunked stage scenery, sea,
 * rain, car light streaks, wind streaks and sparkles. Repeated props are InstancedMesh;
 * scenery chunks are laid out from a seed per chunk, so they cost nothing to "recycle".
 */
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RepeatWrapping,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  type Texture
} from "three";
import { cap, cone, cyl, merge, noise, radial, rbox, rng, roundRect, sph, text, type Mats, type Part, type Textures } from "./kit";
import type { DashColors, Palette } from "./palette";

export const LANES = [-2, 0, 2];
export const STAGE_M = 600;
export const stageAt = (d: number) => Math.floor(Math.max(0, d) / STAGE_M) % 3;
const CH = 24; // scenery chunk length (m)
const VIEW = 190; // how far ahead scenery is laid out (m)

/* ================================================================== sky */

export function createSky(): { dome: Mesh; update: (p: Palette, cam: Vector3) => void; mat: ShaderMaterial } {
  const mat = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new Color() },
      horizon: { value: new Color() },
      bottom: { value: new Color() },
      sunColor: { value: new Color() },
      sunDir: { value: new Vector3(0, 0.2, -1) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunColor; uniform vec3 sunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.85, h), 0.55)) : mix(horizon, bottom, smoothstep(0.0, 0.18, -h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunColor * (pow(s, 6.0) * 0.28 + pow(s, 48.0) * 0.5);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const dome = new Mesh(new SphereGeometry(300, 32, 16), mat);
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  return {
    dome,
    mat,
    update(p, cam) {
      mat.uniforms.top.value.copy(p.top);
      mat.uniforms.horizon.value.copy(p.horizon);
      mat.uniforms.bottom.value.copy(p.sea).lerp(p.horizon, 0.4);
      mat.uniforms.sunColor.value.copy(p.sun);
      mat.uniforms.sunDir.value.copy(p.sunDir);
      dome.position.copy(cam);
    }
  };
}

/** Additive sun (or moon) disc with a soft glow, in the sky ahead. */
export function createSun(tex: Textures): { sprite: Sprite; update: (p: Palette, cam: Vector3) => void } {
  const t = tex.canvas(128, 128, (g, w, h) => radial(g, w, h, [[0, 1], [0.12, 1], [0.2, 0.55], [0.45, 0.12], [1, 0]]));
  const m = new SpriteMaterial({ map: t, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, transparent: true });
  const sprite = new Sprite(m);
  sprite.scale.setScalar(70);
  sprite.renderOrder = -9;
  return {
    sprite,
    update(p, cam) {
      sprite.position.copy(cam).addScaledVector(p.sunDir, 260);
      m.color.copy(p.sun).multiplyScalar(1.6);
    }
  };
}

/* ================================================================== skyline */

/** Two parallax rings of Mumbai silhouettes (towers, water tanks, a dome, a temple spire, cranes). */
export function createSkyline(C: DashColors, tex: Textures) {
  const draw = (seed: number, tall: number) => {
    const r = rng(seed);
    const blocks: [number, number, number, number][] = []; // x, w, h, kind
    for (let x = 0; x < 2048; ) {
      const w = 26 + r() * 70;
      const kind = r();
      const h = kind > 0.93 ? 150 + r() * 70 * tall : 30 + r() * 95 * tall;
      blocks.push([x, w, h, kind]);
      x += w + (r() < 0.25 ? r() * 30 : -4);
    }
    const sil = tex.canvas(2048, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = "#fff";
      for (const [x, bw, bh, k] of blocks) {
        g.fillRect(x, h - bh, bw, bh);
        if (k < 0.2) g.fillRect(x + bw * 0.3, h - bh - 12, bw * 0.3, 12); // water tank
        if (k > 0.86 && k < 0.88) {
          g.beginPath(); // dome
          g.arc(x + bw / 2, h - bh, bw / 2, Math.PI, 0);
          g.fill();
        }
        if (k > 0.88 && k < 0.9) {
          g.beginPath(); // temple spire
          g.moveTo(x, h - bh);
          g.quadraticCurveTo(x + bw / 2, h - bh - 70, x + bw / 2, h - bh - 80);
          g.quadraticCurveTo(x + bw / 2, h - bh - 70, x + bw, h - bh);
          g.fill();
        }
        if (k > 0.9 && k < 0.92) {
          g.fillRect(x + bw / 2, h - bh - 60, 3, 60); // crane
          g.fillRect(x + bw / 2 - 40, h - bh - 60, 80, 3);
        }
      }
    });
    const lights = tex.canvas(2048, 256, (g, w, h) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#fff";
      for (const [x, bw, bh] of blocks)
        for (let yy = h - bh + 8; yy < h - 6; yy += 9)
          for (let xx = x + 4; xx < x + bw - 5; xx += 8) if (r() < 0.22) g.fillRect(xx, yy, 3, 4);
    });
    return { sil, lights };
  };

  const group = new Group();
  const rings = [
    { R: 215, H: 46, seed: 7, tall: 1, shade: 0.0 },
    { R: 255, H: 70, seed: 21, tall: 1.4, shade: 0.55 }
  ].map(({ R, H, seed, tall, shade }) => {
    const { sil, lights } = draw(seed, tall);
    for (const t of [sil, lights]) {
      t.wrapS = RepeatWrapping;
      t.repeat.set(2, 1);
    }
    const geo = new CylinderGeometry(R, R, H, 64, 1, true, Math.PI * 0.5, Math.PI);
    geo.translate(0, H / 2 - 6, 0);
    const silMat = new MeshBasicMaterial({ map: sil, transparent: true, side: BackSide, depthWrite: false, fog: false });
    const litMat = new MeshBasicMaterial({
      map: lights,
      side: BackSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false
    });
    const a = new Mesh(geo, silMat);
    const b = new Mesh(geo, litMat);
    a.renderOrder = b.renderOrder = -8 + shade;
    a.frustumCulled = b.frustumCulled = false;
    group.add(a, b);
    return { silMat, litMat, sil, lights, shade };
  });
  const lit = new Color(C["dash-window-lit"]);
  return {
    group,
    update(p: Palette, cam: Vector3, distance: number) {
      group.position.set(cam.x, 0, cam.z);
      rings.forEach(({ silMat, litMat, sil, lights, shade }, i) => {
        silMat.color.copy(p.skyline).lerp(p.horizon, shade);
        litMat.color.copy(lit).multiplyScalar(p.night * (i ? 0.7 : 1.1));
        litMat.visible = p.night > 0.05;
        sil.offset.x = lights.offset.x = (distance * (i ? 0.00006 : 0.00012)) % 1;
      });
    }
  };
}

/* ================================================================== textures for the ground */

export function groundTextures(C: DashColors, tex: Textures) {
  const ballast = tex.canvas(256, 256, (g, w, h) => noise(g, w, h, C["dash-ballast"], [C["dash-ballast-2"], C["dash-platform"], C["dash-bed"]], 2600, 3.2, 3), true, true);
  const asphalt = tex.canvas(256, 256, (g, w, h) => noise(g, w, h, C["dash-asphalt"], [C["dash-asphalt-2"], C["dash-deck"]], 1800, 2.2, 9), true, true);
  // Gentle ripples as a tangent-space normal map: flat (128,128,255) with soft bumps.
  const ripple = tex.canvas(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "rgb(128,128,255)";
      g.fillRect(0, 0, w, h);
      const r = rng(5);
      for (let i = 0; i < 260; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 6 + r() * 18;
        const gr = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 0, x, y, s);
        gr.addColorStop(0, "rgba(160,160,255,0.55)");
        gr.addColorStop(0.6, "rgba(108,108,255,0.35)");
        gr.addColorStop(1, "rgba(128,128,255,0)");
        g.fillStyle = gr;
        g.fillRect(x - s, y - s, s * 2, s * 2);
      }
    },
    false,
    true
  );
  const platform = tex.canvas(256, 512, (g, w, h) => {
    noise(g, w, h, C["dash-platform"], [C["dash-platform-2"], C["dash-platform-side"]], 900, 2, 11);
    g.strokeStyle = C["dash-platform-2"];
    g.lineWidth = 2;
    for (let y = 0; y < h; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    // Platform edge (u = 0 is the track side): black lip, then the yellow tactile strip.
    g.fillStyle = C["dash-edge-black"];
    g.fillRect(0, 0, 14, h);
    g.fillStyle = C["dash-edge-yellow"];
    g.fillRect(14, 0, 34, h);
    g.fillStyle = C["dash-platform-2"];
    for (let y = 4; y < h; y += 10) for (let x = 18; x < 46; x += 10) g.fillRect(x, y, 4, 4);
  });
  // Facades: 6 columns x 14 floors, so even a tall block keeps small windows.
  const facade = tex.canvas(256, 512, (g, w, h) => {
    g.fillStyle = "#ece7df";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#d3ccc1";
    for (let y = 0; y < h; y += 36) g.fillRect(0, y + 31, w, 5); // floor bands
    g.fillStyle = "#3a414c";
    for (let y = 8; y < h - 10; y += 36) for (let x = 10; x < w - 20; x += 41) roundRect(g, x, y, 22, 20, 2), g.fill();
  });
  const facadeLit = tex.canvas(256, 512, (g, w, h) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h);
    const r = rng(17);
    g.fillStyle = "#fff";
    for (let y = 8; y < h - 10; y += 36) for (let x = 10; x < w - 20; x += 41) if (r() < 0.3) roundRect(g, x, y, 22, 20, 2), g.fill();
  });
  return { ballast, asphalt, ripple, platform, facade, facadeLit };
}

/* ================================================================== track */

export function createTrack(C: DashColors, mats: Mats, t: ReturnType<typeof groundTextures>) {
  const group = new Group();
  const LEN = 260;
  const bedMat = new MeshStandardMaterial({ map: t.ballast, roughness: 0.95 });
  t.ballast.repeat.set(2.4, LEN / 3);
  const bed = new Mesh(new PlaneGeometry(6.6, LEN), bedMat);
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0, -LEN / 2 + 20);
  bed.receiveShadow = true;
  // Embankment under the track (it reads as the deck on the Sea Link).
  const base = new Mesh(merge([{ g: rbox(6.7, 3, LEN, 0.1), c: C["dash-bed"], p: [0, -1.52, -LEN / 2 + 20] }]), mats.paint);
  // Rails: worn steel, rough enough not to mirror the sky (or bloom).
  const railMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.5, envMapIntensity: 0.3 });
  const rails = new Mesh(
    merge(LANES.flatMap((x) => [-0.72, 0.72].flatMap((dx): Part[] => [
      { g: rbox(0.1, 0.13, LEN, 0.03), c: C["dash-rail"], p: [x + dx, 0.12, -LEN / 2 + 20] }
    ]))),
    railMat
  );
  rails.receiveShadow = true;
  const GAP = 1.2;
  const per = Math.ceil(LEN / GAP);
  const sleepers = new InstancedMesh(merge([{ g: rbox(1.9, 0.08, 0.28, 0.03), c: C["dash-sleeper"] }]), mats.paint, per * 3);
  const m = new Matrix4();
  LANES.forEach((x, li) => {
    for (let i = 0; i < per; i++) sleepers.setMatrixAt(li * per + i, m.makeTranslation(x, 0.04, 20 - i * GAP));
  });
  sleepers.receiveShadow = true;
  const sleeperGroup = new Group();
  sleeperGroup.add(sleepers);
  group.add(bed, base, rails, sleeperGroup);
  return {
    group,
    update(distance: number) {
      sleeperGroup.position.z = distance % GAP;
      t.ballast.offset.y = (distance / 3) % 1;
    },
    dispose() {
      bedMat.dispose();
      railMat.dispose();
    }
  };
}

/* ================================================================== scenery */

interface Kind {
  meshes: InstancedMesh[];
  cap: number;
  /** Hidden on the low tier. */
  detail: boolean;
  tint: boolean;
}
interface Place {
  k: number;
  x: number;
  y: number;
  u: number;
  ry: number;
  s?: [number, number, number];
  tint?: Color;
}

export function createScenery(C: DashColors, mats: Mats, tex: Textures, t: ReturnType<typeof groundTextures>) {
  const group = new Group();
  const kinds: Kind[] = [];
  const extraMats: Material[] = [];
  const addKind = (layers: { geo: BufferGeometry; mat: Material }[], cap: number, detail = false, tint = false, receive = false) => {
    const meshes = layers.map(({ geo, mat }) => {
      const im = new InstancedMesh(geo, mat, cap);
      im.instanceMatrix.setUsage(DynamicDrawUsage);
      im.count = 0;
      im.frustumCulled = false;
      im.receiveShadow = receive;
      group.add(im);
      return im;
    });
    kinds.push({ meshes, cap, detail, tint });
    return kinds.length - 1;
  };
  const L = (layer: keyof Mats, parts: Part[]) => ({ geo: merge(parts), mat: mats[layer] });
  const textured = (geo: BufferGeometry, mat: Material) => {
    extraMats.push(mat);
    return { geo, mat };
  };
  const topPlane = (w: number, d: number, uRep: number, vRep: number) => {
    const g = new PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv as BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uRep, uv.getY(i) * vRep);
    return g;
  };

  /* --- shared --- */
  const mast = addKind([
    L("gloss", [
      { g: cyl(0.09, 0.11, 6, 8), c: C["dash-lamp-pole"], p: [0, 3, 0] },
      { g: rbox(2.6, 0.12, 0.12, 0.04), c: C["dash-lamp-pole"], p: [-1.25, 5.8, 0] },
      { g: cyl(0.05, 0.05, 0.35, 6), c: C["dash-hub"], p: [-2.1, 5.6, 0] }
    ])
  ], 12);

  /* --- Dadar --- */
  const platMat = new MeshStandardMaterial({ map: t.platform, roughness: 0.85 });
  const plat = addKind([L("paint", [{ g: rbox(5, 0.95, CH, 0.05), c: C["dash-platform-side"], p: [0, 0.47, 0] }])], 24, false, false, true);
  const platTop = addKind([textured(topPlane(5, CH, 1, CH / 6), platMat)], 24, false, false, true);
  const ground = addKind([L("paint", [{ g: rbox(50, 3, CH, 0.1), c: C["dash-platform-side"], p: [0, -1.5, 0] }])], 24);
  const roof = addKind([
    L("paint", [
      { g: rbox(6, 0.22, CH, 0.08), c: C["dash-roof"], p: [0, 0.3, 0], r: [0, 0, 0.06] },
      { g: rbox(5.6, 0.06, CH, 0.02), c: C["dash-roof-under"], p: [0, 0.14, 0], r: [0, 0, 0.06] }
    ])
  ], 24);
  const pillar = addKind([
    L("gloss", [
      { g: cyl(0.16, 0.16, 3.4, 12), c: C["dash-pillar"], p: [0, 1.7, 0] },
      { g: rbox(0.5, 0.18, 0.5, 0.05), c: C["dash-pillar"], p: [0, 0.09, 0] },
      { g: rbox(0.9, 0.14, 0.3, 0.05), c: C["dash-pillar"], p: [0, 3.4, 0] }
    ])
  ], 48);
  const tube = addKind([L("glow", [{ g: cap(0.05, 1.6, 6), c: C["dash-lamp"], r: [Math.PI / 2, 0, 0], k: 2.2 }])], 48);
  const boardTex = tex.canvas(512, 256, (g, w, h) => {
    g.fillStyle = C["dash-board"];
    roundRect(g, 0, 0, w, h, 24);
    g.fill();
    g.strokeStyle = C["dash-board-ink"];
    g.lineWidth = 8;
    roundRect(g, 10, 10, w - 20, h - 20, 18);
    g.stroke();
    text(g, "दादर", w / 2, h * 0.36, 92, C["dash-board-ink"], 800);
    text(g, "DADAR", w / 2, h * 0.75, 74, C["dash-board-ink"], 900, "system-ui, sans-serif");
  });
  const boardMat = new MeshStandardMaterial({ map: boardTex, roughness: 0.45, emissive: new Color(C["dash-board"]), emissiveIntensity: 0.12, emissiveMap: boardTex });
  const boardFace = new PlaneGeometry(1.7, 0.85);
  boardFace.translate(0, 3.25, 0.07);
  const boardBack = boardFace.clone().rotateY(Math.PI);
  const board = addKind([
    L("gloss", [
      { g: rbox(1.82, 0.97, 0.12, 0.04), c: C["dash-edge-black"], p: [0, 3.25, 0] },
      { g: cyl(0.035, 0.035, 0.9, 6), c: C["dash-lamp-pole"], p: [-0.6, 4.1, 0] },
      { g: cyl(0.035, 0.035, 0.9, 6), c: C["dash-lamp-pole"], p: [0.6, 4.1, 0] }
    ]),
    textured(boardFace, boardMat),
    { geo: boardBack, mat: boardMat }
  ], 12);
  const bench = addKind([
    L("gloss", [
      { g: rbox(1.8, 0.08, 0.45, 0.03), c: C["dash-bench"], p: [0, 0.5, 0] },
      { g: rbox(1.8, 0.4, 0.07, 0.03), c: C["dash-bench"], p: [0, 0.75, -0.22], r: [-0.15, 0, 0] },
      { g: rbox(0.08, 0.5, 0.4, 0.02), c: C["dash-lamp-pole"], p: [-0.75, 0.25, 0] },
      { g: rbox(0.08, 0.5, 0.4, 0.02), c: C["dash-lamp-pole"], p: [0.75, 0.25, 0] }
    ])
  ], 24, true);
  const wall = addKind([L("paint", [{ g: rbox(0.3, 3.4, CH, 0.06), c: C["dash-platform-2"], p: [0, 1.7, 0] }])], 24);
  // Generic ads (no brands): four posters in one atlas, a kind per poster.
  const adTex = tex.canvas(1024, 256, (g, w, h) => {
    const ads: [string, string, string][] = [
      [C["dash-ad-1"], "MONSOON", "SALE"],
      [C["dash-ad-2"], "CUTTING", "CHAI ₹10"],
      [C["dash-ad-3"], "NEW FILM", "FRIDAY"],
      [C["dash-ad-4"], "MUMBAI", "MARATHON"]
    ];
    ads.forEach(([bg, a, b], i) => {
      const x = i * 256;
      g.fillStyle = bg;
      g.fillRect(x, 0, 256, h);
      g.fillStyle = C["dash-ad-ink"];
      g.globalAlpha = 0.25;
      g.beginPath();
      g.arc(x + 200, 60, 90, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      text(g, a, x + 128, h * 0.42, 40, C["dash-ad-ink"], 900, "system-ui, sans-serif");
      text(g, b, x + 128, h * 0.66, 30, C["dash-ad-ink"], 700, "system-ui, sans-serif");
    });
  });
  const adMat = new MeshStandardMaterial({ map: adTex, roughness: 0.35, emissive: new Color("#fff"), emissiveMap: adTex, emissiveIntensity: 0.35 });
  extraMats.push(adMat);
  const ads = [0, 1, 2, 3].map((i) => {
    const g = new PlaneGeometry(2.6, 1.3);
    const uv = g.attributes.uv as BufferAttribute;
    for (let v = 0; v < uv.count; v++) uv.setX(v, (i + uv.getX(v)) / 4);
    g.rotateY(Math.PI / 2);
    return addKind([{ geo: g, mat: adMat }, L("gloss", [{ g: rbox(0.1, 1.45, 2.75, 0.04), c: C["dash-lamp-pole"], p: [-0.06, 0, 0] }])], 12, true);
  });
  const facadeMat = new MeshStandardMaterial({
    map: t.facade,
    emissiveMap: t.facadeLit,
    emissive: new Color(C["dash-window-lit"]),
    emissiveIntensity: 0,
    roughness: 0.8
  });
  extraMats.push(facadeMat);
  const boxUv = (w: number, h: number, d: number) => {
    const g = rbox(w, h, d, 0.02, 1); // scaled per instance, so keep the bevel small
    g.translate(0, h / 2, 0);
    return g;
  };
  const building = addKind([{ geo: boxUv(1, 1, 1), mat: facadeMat }], 60, false, true);

  /* --- Marine Drive --- */
  const seawall = addKind([
    L("paint", [
      { g: rbox(3.2, 3.2, CH, 0.12), c: C["dash-seawall"], p: [0, -1.25, 0] },
      { g: rbox(3.3, 0.12, CH, 0.04), c: C["dash-promenade"], p: [0, 0.38, 0] },
      { g: rbox(0.3, 0.55, CH, 0.1), c: C["dash-promenade"], p: [-1.5, 0.65, 0] }
    ])
  ], 12, false, false, true);
  const tetra = addKind([
    L("paint", [
      { g: cap(0.28, 0.6, 6), c: C["dash-seawall"], r: [0.4, 0, 0.9] },
      { g: cap(0.28, 0.6, 6), c: C["dash-seawall"], r: [-0.6, 0.5, -0.4] },
      { g: cap(0.28, 0.6, 6), c: C["dash-seawall"], r: [1.4, 0, 0] }
    ])
  ], 60, true);
  const lamp = addKind([
    L("gloss", [
      { g: cyl(0.06, 0.09, 4.4, 8), c: C["dash-lamp-pole"], p: [0, 2.2, 0] },
      { g: cap(0.04, 1.1, 6), c: C["dash-lamp-pole"], p: [0.5, 4.38, 0], r: [0, 0, Math.PI / 2 - 0.15] },
      { g: rbox(0.5, 0.12, 0.26, 0.05), c: C["dash-lamp-pole"], p: [1.05, 4.48, 0] }
    ]),
    L("glow", [{ g: rbox(0.42, 0.05, 0.2, 0.02), c: C["dash-lamp"], p: [1.05, 4.4, 0], k: 2.6 }])
  ], 36);
  const roadMat = new MeshStandardMaterial({ map: t.asphalt, normalMap: t.ripple, normalScale: new Vector2(0.25, 0.25), roughness: 0.28, metalness: 0.15 });
  extraMats.push(roadMat);
  const road = addKind([textured(topPlane(1, CH, 3, CH / 6), roadMat)], 24, false, false, true);
  const roadSide = addKind([L("paint", [{ g: rbox(1, 3, CH, 0.06), c: C["dash-deck-side"], p: [0, -1.52, 0] }])], 24);
  const palm = addKind([
    L("paint", [
      { g: cyl(0.1, 0.16, 5, 8), c: C["dash-crate-2"], p: [0, 2.5, 0], r: [0, 0, 0.08] },
      ...[0, 1, 2, 3, 4, 5].map((i): Part => ({
        g: cap(0.12, 1.6, 6),
        c: C["dash-veg-2"],
        p: [0.2 + Math.cos(i * 1.05) * 0.7, 4.9, Math.sin(i * 1.05) * 0.7],
        r: [Math.sin(i * 1.05) * 1.1, 0, -Math.cos(i * 1.05) * 1.1],
        s: [1, 1, 0.35]
      }))
    ])
  ], 24, true);

  /* --- Sea Link --- */
  const deckSide = addKind([
    L("paint", [
      { g: rbox(5.8, 1.8, CH, 0.06), c: C["dash-deck-side"], p: [0, -0.92, 0] }
    ]),
    L("gloss", [{ g: rbox(0.1, 0.7, CH, 0.04), c: C["dash-tower"], p: [2.86, 0.38, 0] }])
  ], 24);
  const pier = addKind([L("paint", [{ g: cyl(0.7, 0.8, 6, 14), c: C["dash-deck-side"], p: [0, -4, 0] }])], 24);
  const towerParts: Part[] = [
    { g: rbox(0.9, 30, 1.3, 0.3), c: C["dash-tower"], p: [-1.5, 13, 0], r: [0, 0, -0.06] },
    { g: rbox(0.9, 30, 1.3, 0.3), c: C["dash-tower"], p: [1.5, 13, 0], r: [0, 0, 0.06] },
    { g: rbox(4, 0.8, 1.2, 0.2), c: C["dash-tower"], p: [0, 8, 0] },
    { g: rbox(1, 9, 1.1, 0.3), c: C["dash-tower"], p: [0, 31, 0] }
  ];
  const cableParts: Part[] = [];
  for (const dir of [-1, 1])
    for (let k = 0; k < 7; k++) {
      const a = new Vector3(0, 34 - k * 1.1, 0);
      const b = new Vector3(dir < 0 ? -1.2 : 1.2, 0.5, (k + 1) * 6.2 * (k % 2 ? 1 : -1));
      const len = a.distanceTo(b);
      const g = cyl(0.045, 0.045, len, 4);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.applyQuaternion(q);
      cableParts.push({ g, c: C["dash-cable"], p: [mid.x, mid.y, mid.z], k: 0.7 });
    }
  const tower = addKind([L("paint", towerParts), L("glow", [...cableParts, { g: sph(0.25, 8, 6), c: C["dash-warn"], p: [0, 36, 0], k: 3 }])], 6);

  const kindCount = kinds.length;
  const C3 = (s: string) => new Color(s);
  const tints = [C3(C["dash-building"]), C3(C["dash-building-2"]), C3(C["dash-building-3"])];

  /* --- per-chunk layouts (seeded, so the same chunk always looks the same) --- */
  const layout = (n: number): Place[] => {
    const s = stageAt(n * CH);
    const r = rng(n * 7919 + 13);
    const out: Place[] = [];
    const P = (k: number, x: number, y: number, u: number, ry = 0, sc?: [number, number, number], tint?: Color) =>
      out.push({ k, x, y, u, ry, s: sc, tint });
    if (s === 0) {
      for (const side of [-1, 1]) {
        P(plat, side * 5.8, 0, CH / 2);
        P(platTop, side * 5.8, 0.952, CH / 2, side < 0 ? Math.PI : 0); // edge strip toward the track
        P(ground, side * 33.3, 0, CH / 2);
        P(roof, side * 6.1, 4.15, CH / 2, side > 0 ? 0 : Math.PI);
        P(wall, side * 8.45, 0.95, CH / 2);
        for (const u of [4, 16]) P(pillar, side * 6.9, 0.95, u);
        for (const u of [7, 19]) P(tube, side * 5.4, 4.05, u);
        P(bench, side * 7.4, 0.95, 11, side > 0 ? -Math.PI / 2 : Math.PI / 2);
        P(ads[Math.floor(r() * 4)], side * 8.27, 2.6, 2.5, side > 0 ? Math.PI : 0);
        P(ads[Math.floor(r() * 4)], side * 8.27, 2.6, 20, side > 0 ? Math.PI : 0);
        for (let b = 0; b < 2; b++) {
          const h = 8 + r() * 12;
          P(building, side * (14 + r() * 10), 0, r() * CH, 0, [6 + r() * 4, h, 6 + r() * 5], tints[Math.floor(r() * 3)]);
        }
      }
      if (n % 2 === 0) P(board, (n % 4 === 0 ? -1 : 1) * 4.6, 0.95, 9);
      P(mast, 3.75, 0.95, 0.5);
    } else if (s === 1) {
      P(seawall, -4.9, 0, CH / 2);
      for (let i = 0; i < 4; i++) P(tetra, -7 - r() * 2, -1.3 + r() * 0.4, r() * CH, r() * 6);
      for (const u of [3, 15]) P(lamp, -5.9, 0.4, u);
      P(road, 7.7, 0.01, CH / 2, 0, [8.8, 1, 1]);
      P(roadSide, 7.7, 0, CH / 2, 0, [8.8, 1, 1]);
      P(ground, 37, 0, CH / 2);
      for (const u of [9, 21]) P(lamp, 12, 0, u, Math.PI);
      for (const u of [4, 16]) P(palm, 12.8, 0, u, r() * 6);
      for (let b = 0; b < 2; b++) {
        const h = 10 + r() * 16;
        P(building, 18 + r() * 6, 0, b * 12 + r() * 4, 0, [7 + r() * 3, h, 9 + r() * 3], tints[Math.floor(r() * 3)]);
      }
      P(mast, 3.75, 0, 0.5);
    } else {
      for (const side of [-1, 1]) {
        P(road, side * 6.2, 0.01, CH / 2, 0, [5.8, 1, 1]);
        P(deckSide, side * 6.2, 0, CH / 2, side > 0 ? 0 : Math.PI);
        P(pier, side * 4.2, 0, CH / 2);
        P(lamp, side * 8.9, 0, side > 0 ? 6 : 18, side > 0 ? Math.PI : 0);
      }
      if (n % 6 === 0) {
        P(tower, -11, 0, CH / 2);
        P(tower, 11, 0, CH / 2);
      }
    }
    return out;
  };

  const cache = new Map<number, Place[]>();
  const counts = new Int32Array(kindCount);
  const mtx = new Matrix4();
  const pos = new Vector3();
  const quat = new Quaternion();
  const scl = new Vector3();
  const UP = new Vector3(0, 1, 0);
  let low = false;

  return {
    group,
    setLow(on: boolean) {
      low = on;
      kinds.forEach((k) => k.detail && k.meshes.forEach((m) => (m.visible = !on)));
    },
    setNight(night: number) {
      facadeMat.emissiveIntensity = night * 1.4;
    },
    update(distance: number) {
      counts.fill(0);
      const nMin = Math.floor((distance - 30) / CH);
      const nMax = Math.floor((distance + VIEW) / CH);
      for (const key of cache.keys()) if (key < nMin) cache.delete(key);
      for (let n = nMin; n <= nMax; n++) {
        if (n < -2) continue;
        let list = cache.get(n);
        if (!list) cache.set(n, (list = layout(n)));
        for (const p of list) {
          const kind = kinds[p.k];
          if (low && kind.detail) continue;
          const i = counts[p.k];
          if (i >= kind.cap) continue;
          counts[p.k] = i + 1;
          pos.set(p.x, p.y, distance - (n * CH + p.u));
          quat.setFromAxisAngle(UP, p.ry);
          if (p.s) scl.set(p.s[0], p.s[1], p.s[2]);
          else scl.set(1, 1, 1);
          mtx.compose(pos, quat, scl);
          for (const m of kind.meshes) {
            m.setMatrixAt(i, mtx);
            if (kind.tint && p.tint) m.setColorAt(i, p.tint);
          }
        }
      }
      kinds.forEach((k, i) =>
        k.meshes.forEach((m) => {
          m.count = counts[i];
          m.instanceMatrix.needsUpdate = true;
          if (k.tint && m.instanceColor) m.instanceColor.needsUpdate = true;
        })
      );
    },
    dispose() {
      extraMats.forEach((m) => m.dispose());
      group.traverse((o) => (o as Mesh).geometry?.dispose());
    }
  };
}

/* ================================================================== sea */

export function createSea(t: ReturnType<typeof groundTextures>) {
  const ripple = t.ripple.clone();
  ripple.needsUpdate = true;
  ripple.repeat.set(60, 60);
  const mat = new MeshStandardMaterial({ roughness: 0.16, metalness: 0.1, normalMap: ripple, normalScale: new Vector2(0.6, 0.6) });
  const sea = new Mesh(new PlaneGeometry(700, 700), mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -2.6;
  return {
    mesh: sea,
    update(p: Palette, cam: Vector3, distance: number, time: number) {
      mat.color.copy(p.sea);
      sea.position.x = cam.x;
      sea.position.z = cam.z - 200;
      ripple.offset.set((time * 0.01) % 1, (-distance / 700) * 60 % 1);
    },
    dispose() {
      mat.dispose();
      ripple.dispose();
    }
  };
}

/** Marine Drive's "Queen's Necklace": a far arc of street lights along the bay. */
export function createNecklace(C: DashColors) {
  const N = 70;
  const mat = new MeshBasicMaterial({ color: new Color(C["dash-lamp"]).multiplyScalar(2.2), transparent: true, toneMapped: false, fog: false });
  const im = new InstancedMesh(new SphereGeometry(0.55, 6, 4), mat, N);
  const m = new Matrix4();
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const a = -0.35 - u * 1.9;
    im.setMatrixAt(i, m.makeTranslation(Math.cos(a) * 150 - 40, -1.4 + Math.sin(u * Math.PI) * 0.6, Math.sin(a) * 150 - 80));
  }
  im.frustumCulled = false;
  return {
    mesh: im,
    update(weight: number, cam: Vector3) {
      im.visible = weight > 0.02;
      mat.opacity = weight;
      im.position.set(cam.x, 0, cam.z);
    }
  };
}

/* ================================================================== moving lights, rain, wind, sparkles */

/** Car head- and tail-light streaks on the Sea Link roadway. */
export function createCars(C: DashColors) {
  const N = 26;
  const mat = new MeshBasicMaterial({ color: new Color(2.4, 2.4, 2.4), toneMapped: false, transparent: true });
  const geo = cap(0.09, 2.6, 6);
  geo.rotateX(Math.PI / 2);
  const im = new InstancedMesh(geo, mat, N);
  im.instanceMatrix.setUsage(DynamicDrawUsage);
  im.frustumCulled = false;
  const head = new Color(C["dash-car-head"]);
  const tail = new Color(C["dash-car-tail"]);
  const r = rng(99);
  const cars = Array.from({ length: N }, (_, i) => {
    const oncoming = i % 2 === 0;
    im.setColorAt(i, oncoming ? head : tail);
    return { x: (oncoming ? -1 : 1) * (4.5 + (i % 4 < 2 ? 0 : 2.4)), z: -r() * 200, v: oncoming ? 18 + r() * 8 : -(8 + r() * 6) };
  });
  const m = new Matrix4();
  return {
    mesh: im,
    update(dt: number, dz: number, weight: number) {
      im.visible = weight > 0.02;
      if (!im.visible) return;
      mat.opacity = weight;
      cars.forEach((c, i) => {
        c.z += c.v * dt + dz;
        if (c.z > 15) c.z -= 215;
        if (c.z < -200) c.z += 215;
        im.setMatrixAt(i, m.makeTranslation(c.x + (i % 2 ? 0.35 : -0.35), 0.55, c.z));
      });
      im.instanceMatrix.needsUpdate = true;
    }
  };
}

/** Light rain on the Sea Link: a fixed pool of line segments recycled around the camera. */
export function createRain(C: DashColors, max: number) {
  const pos = new Float32Array(max * 6);
  const drops = Array.from({ length: max }, () => new Vector3((Math.random() - 0.5) * 28, Math.random() * 14, -Math.random() * 50 + 6));
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3).setUsage(DynamicDrawUsage));
  const mat = new LineBasicMaterial({ color: C["dash-rain"], transparent: true, opacity: 0.35, depthWrite: false });
  const lines = new LineSegments(geo, mat);
  lines.frustumCulled = false;
  let budget = max;
  return {
    mesh: lines,
    setBudget(n: number) {
      budget = Math.min(max, n);
    },
    update(dt: number, speed: number, weight: number, cam: Vector3) {
      const n = Math.floor(budget * weight);
      lines.visible = n > 0;
      if (!n) return;
      mat.opacity = 0.3 + weight * 0.35;
      const fall = 24;
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        d.y -= fall * dt;
        d.z += speed * dt;
        if (d.y < 0 || d.z > 8) {
          d.set((Math.random() - 0.5) * 28, 8 + Math.random() * 7, -Math.random() * 50 + 4);
        }
        const x = cam.x + d.x;
        const z = cam.z - 6 + d.z;
        const k = i * 6;
        pos[k] = x;
        pos[k + 1] = d.y;
        pos[k + 2] = z;
        pos[k + 3] = x;
        pos[k + 4] = d.y + 0.9;
        pos[k + 5] = z - speed * 0.02;
      }
      geo.setDrawRange(0, n * 2);
      (geo.attributes.position as BufferAttribute).needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}

/** Wind streaks past the camera; longer and brighter with speed. */
export function createWind(N = 40) {
  const pos = new Float32Array(N * 6);
  const col = new Float32Array(N * 6);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3).setUsage(DynamicDrawUsage));
  geo.setAttribute("color", new Float32BufferAttribute(col, 3).setUsage(DynamicDrawUsage));
  const mat = new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const lines = new LineSegments(geo, mat);
  lines.frustumCulled = false;
  const streaks = Array.from({ length: N }, () => new Vector3());
  const respawn = (v: Vector3, far: boolean) => {
    const a = Math.random() * Math.PI * 2;
    const r = 1.6 + Math.random() * 4.5;
    v.set(Math.cos(a) * r, 2 + Math.sin(a) * r * 0.7, far ? -40 - Math.random() * 10 : -Math.random() * 50);
  };
  streaks.forEach((s) => respawn(s, false));
  return {
    mesh: lines,
    update(dt: number, speed: number, amount: number, cam: Vector3) {
      lines.visible = amount > 0.02;
      if (!lines.visible) return;
      const len = 0.6 + speed * 0.09;
      for (let i = 0; i < N; i++) {
        const s = streaks[i];
        s.z += speed * 1.6 * dt;
        if (s.z > 4) respawn(s, true);
        const k = i * 6;
        const x = cam.x + s.x;
        const y = Math.max(0.3, s.y);
        const z = cam.z - 4 + s.z;
        pos.set([x, y, z, x, y, z - len], k);
        const b = amount * 0.5;
        col.set([b, b, b, 0, 0, 0], k);
      }
      (geo.attributes.position as BufferAttribute).needsUpdate = true;
      (geo.attributes.color as BufferAttribute).needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}

/** Pooled sparkle particles for coin pick-ups and power-ups. */
export function createSparkles(C: DashColors, tex: Textures, N = 120) {
  const star = tex.canvas(64, 64, (g, w, h) => {
    radial(g, w, h, [[0, 1], [0.25, 0.6], [1, 0]]);
    g.fillStyle = "#fff";
    g.fillRect(w / 2 - 1, 4, 2, h - 8);
    g.fillRect(4, h / 2 - 1, w - 8, 2);
  });
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3).setUsage(DynamicDrawUsage));
  geo.setAttribute("color", new Float32BufferAttribute(col, 3).setUsage(DynamicDrawUsage));
  const mat = new PointsMaterial({
    size: 0.32,
    map: star,
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  const ps = Array.from({ length: N }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, max: 1, c: new Color() }));
  let next = 0;
  const base = new Color(C["dash-sparkle"]);
  return {
    mesh: points,
    burst(x: number, y: number, z: number, n: number, color?: Color) {
      for (let i = 0; i < n; i++) {
        const s = ps[next];
        next = (next + 1) % N;
        s.p.set(x, y, z);
        s.v.set((Math.random() - 0.5) * 4, 1.5 + Math.random() * 3, (Math.random() - 0.5) * 4);
        s.life = s.max = 0.35 + Math.random() * 0.35;
        s.c.copy(color ?? base).multiplyScalar(2);
      }
    },
    update(dt: number, dz: number) {
      for (let i = 0; i < N; i++) {
        const s = ps[i];
        if (s.life > 0) {
          s.life -= dt;
          s.v.y -= 6 * dt;
          s.p.addScaledVector(s.v, dt);
          s.p.z += dz;
        }
        const f = Math.max(0, s.life / s.max);
        pos.set([s.p.x, s.p.y, s.p.z], i * 3);
        col.set([s.c.r * f, s.c.g * f, s.c.b * f], i * 3);
      }
      (geo.attributes.position as BufferAttribute).needsUpdate = true;
      (geo.attributes.color as BufferAttribute).needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}

/** Soft blob shadows (one instanced quad) under the runner, obstacles and coins. */
export function createBlobs(C: DashColors, tex: Textures, N = 96) {
  const t = tex.canvas(64, 64, (g, w, h) => radial(g, w, h, [[0, 0.75], [0.5, 0.4], [1, 0]]));
  const geo = new PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new MeshBasicMaterial({
    map: t,
    color: C["dash-blob"],
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  const im = new InstancedMesh(geo, mat, N);
  im.instanceMatrix.setUsage(DynamicDrawUsage);
  im.frustumCulled = false;
  im.renderOrder = 1;
  const m = new Matrix4();
  let n = 0;
  return {
    mesh: im,
    begin() {
      n = 0;
    },
    add(x: number, y: number, z: number, sx: number, sz: number) {
      if (n >= N) return;
      m.makeScale(sx, 1, sz).setPosition(x, y, z);
      im.setMatrixAt(n++, m);
    },
    end() {
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    }
  };
}

export type { Texture };
