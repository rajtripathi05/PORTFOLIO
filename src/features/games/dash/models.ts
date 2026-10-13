/**
 * Mumbai Local Dash models, all procedural: the runner (an original character), the
 * obstacles, the vada pav coin and the power-ups.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  type Texture
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cap, cone, cyl, fadeCone, merge, model, rbox, roundRect, sph, text, torus, type Mats, type Part, type Textures } from "./kit";
import type { DashColors } from "./palette";

/* ------------------------------------------------------------ runner */

export interface Rig {
  root: Group;
  /** Lean/squash pivot at the feet. */
  body: Group;
  hips: Group;
  torso: Group;
  head: Group;
  legL: Group;
  legR: Group;
  armL: Group;
  armR: Group;
  umbrella: Group;
}

/** A friendly runner in a blue tee with an orange backpack. Faces -z (away from the camera). */
export function buildRunner(C: DashColors, mats: Mats): Rig {
  const pivot = (x: number, y: number, z: number, child?: Object3D) => {
    const g = new Group();
    g.position.set(x, y, z);
    if (child) g.add(child);
    return g;
  };

  const leg = () =>
    model(
      {
        paint: [
          { g: cap(0.105, 0.5), c: C["dash-pants"], p: [0, -0.33, 0] },
          { g: rbox(0.2, 0.13, 0.32, 0.06), c: C["dash-shoe"], p: [0, -0.72, -0.05] },
          { g: rbox(0.21, 0.05, 0.33, 0.02), c: C["dash-sole"], p: [0, -0.785, -0.05] }
        ]
      },
      mats
    );
  const arm = () =>
    model(
      {
        paint: [
          { g: cap(0.085, 0.16), c: C["dash-shirt"], p: [0, -0.12, 0] },
          { g: cap(0.065, 0.2), c: C["dash-skin"], p: [0, -0.34, 0] },
          { g: sph(0.075, 10, 8), c: C["dash-skin"], p: [0, -0.48, 0] }
        ]
      },
      mats
    );

  const torsoMesh = model(
    {
      paint: [
        { g: cap(0.235, 0.26, 14), c: C["dash-shirt"], p: [0, 0.3, 0], s: [1, 1, 0.82] },
        { g: rbox(0.46, 0.08, 0.36, 0.035), c: C["dash-shirt-2"], p: [0, 0.06, 0] },
        // Backpack on the back (+z), with a pocket and straps over the shoulders.
        { g: rbox(0.38, 0.44, 0.2, 0.08), c: C["dash-backpack"], p: [0, 0.36, 0.25] },
        { g: rbox(0.28, 0.16, 0.08, 0.04), c: C["dash-backpack-2"], p: [0, 0.24, 0.37] },
        { g: rbox(0.06, 0.05, 0.42, 0.02), c: C["dash-backpack-2"], p: [-0.13, 0.6, 0.02] },
        { g: rbox(0.06, 0.05, 0.42, 0.02), c: C["dash-backpack-2"], p: [0.13, 0.6, 0.02] },
        { g: cap(0.07, 0.06), c: C["dash-skin"], p: [0, 0.66, 0] },
        { g: torus(0.1, 0.03, 6, 14), c: C["dash-shirt-2"], p: [0, 0.62, 0], r: [Math.PI / 2, 0, 0] }
      ]
    },
    mats
  );

  // Head: round, with a swept hair cap and a little tuft; ears and eyes on the face (-z).
  const hairCap = new SphereGeometry(0.232, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62);
  const headMesh = model(
    {
      paint: [
        { g: sph(0.215, 18, 14), c: C["dash-skin"], s: [1, 1.05, 1] },
        // The hair covers the back of the head (+z, toward the camera) down to the neck.
        { g: hairCap, c: C["dash-hair"], p: [0, 0.02, 0.015], r: [0.55, 0, 0] },
        { g: cap(0.07, 0.1, 8), c: C["dash-hair"], p: [0.04, 0.24, -0.08], r: [-0.9, 0, 0.3] },
        { g: sph(0.05, 8, 6), c: C["dash-skin"], p: [-0.215, 0, 0.01] },
        { g: sph(0.05, 8, 6), c: C["dash-skin"], p: [0.215, 0, 0.01] },
        { g: sph(0.028, 8, 6), c: C["dash-eye"], p: [-0.08, 0.02, -0.195] },
        { g: sph(0.028, 8, 6), c: C["dash-eye"], p: [0.08, 0.02, -0.195] }
      ]
    },
    mats
  );

  const umbrella = model(
    {
      paint: [
        { g: new SphereGeometry(0.7, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), c: C["dash-umbrella"], p: [0, -0.35, 0] },
        { g: cyl(0.018, 0.018, 0.9, 6), c: C["dash-handle"], p: [0, -0.2, 0] },
        { g: torus(0.06, 0.018, 6, 10, ), c: C["dash-handle"], p: [0.06, -0.65, 0], r: [0, Math.PI / 2, 0] }
      ]
    },
    mats
  );
  umbrella.position.set(0.1, 1.1, 0);
  umbrella.visible = false;

  const legL = pivot(-0.12, 0, 0, leg());
  const legR = pivot(0.12, 0, 0, leg());
  const armL = pivot(-0.3, 0.6, 0, arm());
  const armR = pivot(0.3, 0.6, 0, arm());
  const head = pivot(0, 0.95, 0, headMesh);
  const torso = pivot(0, 0, 0, torsoMesh);
  torso.add(armL, armR, head, umbrella);
  const hips = pivot(0, 0.82, 0);
  hips.add(legL, legR, torso);
  const body = pivot(0, 0, 0, hips);
  const root = pivot(0, 0, 0, body);
  return { root, body, hips, torso, head, legL, legR, armL, armR, umbrella };
}

/* ------------------------------------------------------------ obstacles */

const wheel = (C: DashColors, x: number, y: number, z: number, r: number): Part[] => [
  { g: torus(r, r * 0.34, 8, 16), c: C["dash-wheel"], p: [x, y, z], r: [0, Math.PI / 2, 0] },
  { g: cyl(r * 0.55, r * 0.55, 0.06, 10), c: C["dash-hub"], p: [x, y, z], r: [0, 0, Math.PI / 2] }
];

/** Mumbai auto-rickshaw: black body, yellow canopy, one headlight. Its front faces +z. */
export function buildRickshaw(C: DashColors, mats: Mats): Group {
  const g = model(
    {
      gloss: [
        { g: rbox(1.3, 0.55, 1.5, 0.16), c: C["dash-rick-body"], p: [0, 0.62, -0.25] },
        { g: rbox(0.62, 1.0, 0.42, 0.16), c: C["dash-rick-body"], p: [0, 0.82, 0.78] },
        { g: rbox(0.5, 0.18, 0.5, 0.08), c: C["dash-rick-roof"], p: [0, 0.48, 0.95] },
        // Canopy: roof, rounded back and thin side pillars.
        { g: rbox(1.38, 0.14, 1.75, 0.07), c: C["dash-rick-roof"], p: [0, 1.62, -0.05] },
        { g: rbox(1.38, 0.78, 0.16, 0.07), c: C["dash-rick-roof"], p: [0, 1.25, -0.85] },
        { g: rbox(0.05, 0.65, 0.05, 0.02), c: C["dash-rick-body"], p: [-0.64, 1.25, 0.72] },
        { g: rbox(0.05, 0.65, 0.05, 0.02), c: C["dash-rick-body"], p: [0.64, 1.25, 0.72] },
        { g: cyl(0.02, 0.02, 0.7, 6), c: C["dash-hub"], p: [0, 1.36, 0.92], r: [0, 0, Math.PI / 2] }
      ],
      paint: [
        { g: rbox(1.1, 0.42, 0.5, 0.1), c: C["dash-rick-seat"], p: [0, 1.0, -0.6] },
        { g: rbox(1.1, 0.12, 0.6, 0.05), c: C["dash-rick-seat"], p: [0, 0.92, -0.35] },
        ...wheel(C, -0.62, 0.24, -0.55, 0.23),
        ...wheel(C, 0.62, 0.24, -0.55, 0.23),
        ...wheel(C, 0, 0.24, 0.95, 0.23)
      ],
      glass: [{ g: rbox(0.95, 0.52, 0.04, 0.02), c: C["dash-window"], p: [0, 1.3, 0.86], r: [-0.12, 0, 0] }],
      glow: [{ g: sph(0.09, 12, 8), c: C["dash-headlight"], p: [0, 1.08, 1.0], s: [1, 1, 0.5], k: 2.4 }]
    },
    mats
  );
  g.scale.setScalar(0.92);
  return g;
}

/** A vegetable handcart (thela) with crates, two big wheels and handles toward the camera. */
export function buildCart(C: DashColors, mats: Mats): Group {
  const crate = (x: number, y: number, z: number, c: string, veg: string): Part[] => [
    { g: rbox(0.5, 0.3, 0.42, 0.04), c, p: [x, y, z] },
    { g: sph(0.07, 8, 6), c: veg, p: [x - 0.12, y + 0.17, z - 0.08] },
    { g: sph(0.07, 8, 6), c: veg, p: [x + 0.08, y + 0.17, z + 0.05] },
    { g: sph(0.07, 8, 6), c: veg, p: [x + 0.1, y + 0.17, z - 0.11] }
  ];
  return model(
    {
      paint: [
        { g: rbox(1.35, 0.1, 1.55, 0.04), c: C["dash-cart"], p: [0, 0.62, 0] },
        { g: rbox(1.35, 0.14, 0.06, 0.03), c: C["dash-cart"], p: [0, 0.74, 0.76] },
        { g: rbox(1.35, 0.14, 0.06, 0.03), c: C["dash-cart"], p: [0, 0.74, -0.76] },
        { g: cap(0.03, 0.75, 6), c: C["dash-cart"], p: [-0.55, 0.66, 1.15], r: [Math.PI / 2, 0, 0] },
        { g: cap(0.03, 0.75, 6), c: C["dash-cart"], p: [0.55, 0.66, 1.15], r: [Math.PI / 2, 0, 0] },
        ...crate(-0.32, 0.82, -0.36, C["dash-crate"], C["dash-veg-1"]),
        ...crate(0.32, 0.82, -0.36, C["dash-crate-2"], C["dash-veg-2"]),
        ...crate(-0.32, 0.82, 0.3, C["dash-crate-2"], C["dash-veg-3"]),
        ...crate(0.3, 0.82, 0.3, C["dash-crate"], C["dash-veg-1"]),
        ...crate(0, 1.13, -0.05, C["dash-crate"], C["dash-veg-2"]),
        ...wheel(C, -0.74, 0.34, 0, 0.32),
        ...wheel(C, 0.74, 0.34, 0, 0.32)
      ]
    },
    mats
  );
}

/** "Mind the gap" barrier: slide under the board. */
export function buildBarrier(C: DashColors, mats: Mats, tex: Textures): Group {
  const g = model(
    {
      gloss: [
        { g: cap(0.06, 2.2, 8), c: C["dash-barrier-2"], p: [-0.98, 1.16, 0] },
        { g: cap(0.06, 2.2, 8), c: C["dash-barrier-2"], p: [0.98, 1.16, 0] },
        { g: rbox(0.3, 0.06, 0.3, 0.02), c: C["dash-barrier"], p: [-0.98, 0.03, 0] },
        { g: rbox(0.3, 0.06, 0.3, 0.02), c: C["dash-barrier"], p: [0.98, 0.03, 0] },
        { g: rbox(2.1, 0.62, 0.1, 0.05), c: C["dash-barrier"], p: [0, 1.4, 0] },
        { g: rbox(2.1, 0.12, 0.12, 0.05), c: C["dash-barrier"], p: [0, 2.28, 0] }
      ],
      glow: [
        { g: sph(0.06, 8, 6), c: C["dash-warn"], p: [-0.98, 2.4, 0], k: 2.5 },
        { g: sph(0.06, 8, 6), c: C["dash-warn"], p: [0.98, 2.4, 0], k: 2.5 }
      ]
    },
    mats
  );
  const t = tex.canvas(512, 128, (x, w, h) => {
    x.fillStyle = C["dash-barrier"];
    x.fillRect(0, 0, w, h);
    // Hazard stripes at both ends.
    x.save();
    x.beginPath();
    x.rect(0, 0, 70, h);
    x.rect(w - 70, 0, 70, h);
    x.clip();
    for (let i = -h; i < w; i += 36) {
      x.fillStyle = C["dash-barrier-2"];
      x.beginPath();
      x.moveTo(i, h);
      x.lineTo(i + 18, h);
      x.lineTo(i + 18 + h, 0);
      x.lineTo(i + h, 0);
      x.fill();
    }
    x.restore();
    text(x, "MIND THE GAP", w / 2, h / 2 + 3, 52, C["dash-barrier-ink"], 900, "system-ui, sans-serif");
  });
  const board = new Mesh(new PlaneGeometry(2.04, 0.56), new MeshStandardMaterial({ map: t, roughness: 0.5 }));
  board.position.set(0, 1.4, 0.052);
  g.add(board);
  return g;
}

export const TRAIN_CARS = 3;
export const CAR_LEN = 6.4;

/** The oncoming local: a rounded cab, cars with a cream-and-maroon livery, headlights with light cones. */
export function buildTrain(C: DashColors, mats: Mats, tex: Textures): Group {
  const g = new Group();
  const paint: Part[] = [];
  const glow: Part[] = [];
  for (let i = 0; i < TRAIN_CARS; i++) {
    const cz = -(CAR_LEN / 2 + i * (CAR_LEN + 0.15));
    paint.push(
      { g: rbox(1.9, 2.55, CAR_LEN, 0.22), c: C["dash-train-cream"], p: [0, 1.62, cz] },
      { g: rbox(1.7, 0.3, CAR_LEN - 0.3, 0.14), c: C["dash-train-roof"], p: [0, 2.95, cz] },
      { g: rbox(1.6, 0.35, CAR_LEN - 1, 0.08), c: C["dash-wheel"], p: [0, 0.3, cz] }
    );
  }
  // Cab nose: slightly rounder and lower at the front.
  paint.push({ g: rbox(1.92, 2.3, 0.5, 0.26), c: C["dash-train"], p: [0, 1.5, -0.12] });
  glow.push(
    { g: sph(0.12, 12, 8), c: C["dash-headlight"], p: [-0.58, 0.85, 0.14], s: [1, 1, 0.4], k: 3 },
    { g: sph(0.12, 12, 8), c: C["dash-headlight"], p: [0.58, 0.85, 0.14], s: [1, 1, 0.4], k: 3 },
    { g: sph(0.07, 8, 6), c: C["dash-headlight"], p: [0, 2.82, 0.0], s: [1, 1, 0.5], k: 3 }
  );
  g.add(model({ gloss: paint, glow }, mats));

  // Livery panels on both sides of every car, and the cab front with the route board.
  const side = tex.canvas(1024, 256, (x, w, h) => {
    x.fillStyle = C["dash-train-cream"];
    x.fillRect(0, 0, w, h);
    x.fillStyle = C["dash-train"];
    x.fillRect(0, h * 0.58, w, h * 0.42);
    x.fillStyle = C["dash-train-stripe"];
    x.fillRect(0, h * 0.54, w, h * 0.05);
    const door = (dx: number) => {
      x.fillStyle = C["dash-door"];
      roundRect(x, dx, h * 0.12, 92, h * 0.86, 10);
      x.fill();
    };
    door(w * 0.16);
    door(w * 0.74);
    x.fillStyle = C["dash-window"];
    for (let k = 0; k < 6; k++) {
      const wx = w * 0.3 + k * 66;
      if (wx > w * 0.68) break;
      roundRect(x, wx, h * 0.16, 54, h * 0.3, 10);
      x.fill();
    }
  });
  const sideGeo: BufferGeometry[] = [];
  for (let i = 0; i < TRAIN_CARS; i++) {
    const cz = -(CAR_LEN / 2 + i * (CAR_LEN + 0.15));
    for (const sx of [-1, 1]) {
      const p = new PlaneGeometry(CAR_LEN - 0.4, 2.3);
      p.rotateY((sx * Math.PI) / 2);
      p.translate(sx * 0.958, 1.62, cz);
      sideGeo.push(p);
    }
  }
  const sides = new Mesh(mergeGeometries(sideGeo)!, new MeshStandardMaterial({ map: side, roughness: 0.4, metalness: 0.3 }));
  sideGeo.forEach((p) => p.dispose());
  g.add(sides);

  const front = tex.canvas(256, 320, (x, w, h) => {
    x.fillStyle = C["dash-train"];
    x.fillRect(0, 0, w, h);
    x.fillStyle = C["dash-train-stripe"];
    x.fillRect(0, h * 0.62, w, h * 0.06);
    x.fillStyle = C["dash-board-ink"];
    roundRect(x, w * 0.12, h * 0.05, w * 0.76, h * 0.12, 8);
    x.fill();
    text(x, "चर्चगेट  CHURCHGATE", w / 2, h * 0.112, 20, C["dash-train-stripe"], 800);
    x.fillStyle = C["dash-window"];
    roundRect(x, w * 0.1, h * 0.21, w * 0.8, h * 0.32, 18);
    x.fill();
    x.fillStyle = C["dash-train-cream"];
    x.globalAlpha = 0.12;
    x.beginPath();
    x.moveTo(w * 0.2, h * 0.22);
    x.lineTo(w * 0.4, h * 0.22);
    x.lineTo(w * 0.22, h * 0.52);
    x.lineTo(w * 0.12, h * 0.52);
    x.fill();
    x.globalAlpha = 1;
    text(x, "F", w / 2, h * 0.82, 44, C["dash-train-cream"], 900, "system-ui, sans-serif");
  });
  const face = new Mesh(new PlaneGeometry(1.86, 2.25), new MeshStandardMaterial({ map: front, roughness: 0.35, metalness: 0.3 }));
  face.position.set(0, 1.5, 0.135);
  g.add(face);

  // Additive light cones from the headlights, pointing at the camera.
  const beam = (x: number) => {
    const c = fadeCone(cone(0.9, 9, 18), C["dash-headlight"], 0.28);
    c.rotateX(-Math.PI / 2);
    c.translate(x, 0.85, 4.6);
    return c;
  };
  const cones = new Mesh(mergeGeometries([beam(-0.58), beam(0.58)])!, mats.add);
  cones.name = "cones";
  g.add(cones);
  g.traverse((o) => {
    if ((o as Mesh).isMesh && o !== cones) o.castShadow = true;
  });
  return g;
}

/* ------------------------------------------------------------ coins and power-ups */

/** Vada pav: glossy split bun, orange patty, a green chilli on the side. */
export function vadaPavGeometry(C: DashColors): BufferGeometry {
  const domeTop = new SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeBot = new SphereGeometry(0.3, 16, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  return merge([
    { g: domeTop, c: C["vp-bun"], p: [0, 0.04, 0], s: [1, 0.62, 1] },
    { g: domeBot, c: C["vp-bun-light"], p: [0, -0.04, 0], s: [1, 0.35, 1] },
    { g: cyl(0.3, 0.3, 0.06, 16), c: C["vp-bun-light"], p: [0, -0.02, 0] },
    { g: torus(0.25, 0.07, 8, 18), c: C["vp-patty"], p: [0, 0.01, 0], r: [Math.PI / 2, 0, 0] },
    { g: cap(0.035, 0.22, 6), c: C["vp-chilli"], p: [0.34, 0.02, 0.05], r: [0.3, 0, 0.5] }
  ]);
}

export type PowerKind = "chai" | "umbrella" | "fast";

/** Power-up icons (cutting chai, umbrella, a mini local), each with a glowing halo sprite. */
export function buildPower(kind: PowerKind, C: DashColors, mats: Mats, halo: Texture): Group {
  const parts: Record<PowerKind, () => Group> = {
    chai: () =>
      model(
        {
          glass: [{ g: cyl(0.19, 0.14, 0.42, 14), c: C["dash-chai-glass"] }],
          paint: [{ g: cyl(0.17, 0.135, 0.3, 14), c: C["dash-chai"], p: [0, -0.04, 0] }]
        },
        mats,
        false
      ),
    umbrella: () =>
      model(
        {
          paint: [
            { g: new SphereGeometry(0.42, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.35), c: C["dash-umbrella"], p: [0, -0.1, 0] },
            { g: cyl(0.02, 0.02, 0.6, 6), c: C["dash-handle"], p: [0, -0.1, 0] }
          ]
        },
        mats,
        false
      ),
    fast: () =>
      model(
        {
          gloss: [
            { g: rbox(0.46, 0.42, 0.9, 0.12), c: C["dash-train"] },
            { g: rbox(0.48, 0.07, 0.86, 0.03), c: C["dash-train-stripe"], p: [0, -0.04, 0] }
          ],
          glass: [{ g: rbox(0.48, 0.14, 0.7, 0.04), c: C["dash-window"], p: [0, 0.1, 0] }],
          glow: [{ g: sph(0.05, 8, 6), c: C["dash-headlight"], p: [0, -0.1, 0.45], k: 3 }]
        },
        mats,
        false
      )
  };
  const g = parts[kind]();
  const color = { chai: C["dash-halo-chai"], umbrella: C["dash-halo-umbrella"], fast: C["dash-halo-fast"] }[kind];
  const ring = new Mesh(
    new PlaneGeometry(1.5, 1.5),
    new MeshBasicMaterial({ map: halo, color, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide })
  );
  ring.name = "halo";
  const wrap = new Group();
  wrap.add(g, ring);
  return wrap;
}
