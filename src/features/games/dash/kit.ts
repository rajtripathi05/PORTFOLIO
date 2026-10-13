/**
 * Mumbai Local Dash building blocks: soft geometry (rounded boxes, capsules) merged into
 * one vertex-coloured mesh per material layer, and every texture drawn on a canvas at
 * start-up. Nothing is downloaded.
 */
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TorusGeometry
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];

/* ------------------------------------------------------------ shapes */

/** A box with softened edges; the radius is clamped to what the box can take. */
export const rbox = (w: number, h: number, d: number, r = 0.06, seg = 2) =>
  new RoundedBoxGeometry(w, h, d, seg, Math.max(0.001, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002)));
/** Capsule along Y; `len` is the straight middle part. */
export const cap = (r: number, len: number, radial = 10) => new CapsuleGeometry(r, len, 4, radial);
export const cyl = (rt: number, rb: number, h: number, seg = 14) => new CylinderGeometry(rt, rb, h, seg);
export const sph = (r: number, w = 14, h = 10) => new SphereGeometry(r, w, h);
export const torus = (r: number, t: number, rs = 8, ts = 18) => new TorusGeometry(r, t, rs, ts);
export const cone = (r: number, h: number, seg = 16) => new ConeGeometry(r, h, seg, 1, true);

export interface Part {
  g: BufferGeometry;
  c: string;
  p?: V3;
  r?: V3;
  s?: V3;
  /** Colour multiplier for glowing parts (HDR, so bloom picks them up). */
  k?: number;
}

/** Places and colours each part, then merges them into a single geometry. */
export function merge(parts: Part[], keepUv = false): BufferGeometry {
  const list = parts.map(({ g, c, p, r, s, k }) => {
    const x = g.index ? g.toNonIndexed() : g.clone();
    g.dispose();
    if (s) x.scale(s[0], s[1], s[2]);
    if (r) x.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
    if (p) x.translate(p[0], p[1], p[2]);
    const col = new Color(c);
    if (k) col.multiplyScalar(k);
    const n = x.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = col.r;
      arr[i * 3 + 1] = col.g;
      arr[i * 3 + 2] = col.b;
    }
    x.setAttribute("color", new BufferAttribute(arr, 3));
    if (!keepUv) x.deleteAttribute("uv");
    return x;
  });
  const merged = mergeGeometries(list)!;
  list.forEach((g) => g.dispose());
  return merged;
}

export type Layer = "paint" | "gloss" | "glass" | "glow" | "add";
export type Mats = Record<Layer, Material>;

/** One mesh per material layer, grouped. Shadows are flagged here and enabled per tier. */
export function model(layers: Partial<Record<Layer, Part[]>>, mats: Mats, shadow = true): Group {
  const g = new Group();
  for (const [layer, parts] of Object.entries(layers) as [Layer, Part[]][]) {
    if (!parts.length) continue;
    const m = new Mesh(merge(parts), mats[layer]);
    m.castShadow = shadow && (layer === "paint" || layer === "gloss");
    m.name = layer;
    g.add(m);
  }
  return g;
}

/** Fades an additive cone from bright at the tip to black at the open end. */
export function fadeCone(g: BufferGeometry, color: string, k: number): BufferGeometry {
  const pos = g.attributes.position;
  const c = new Color(color).multiplyScalar(k);
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - min.y) / (max.y - min.y || 1); // 1 at the tip
    const f = t * t;
    arr.set([c.r * f, c.g * f, c.b * f], i * 3);
  }
  g.setAttribute("color", new BufferAttribute(arr, 3));
  g.deleteAttribute("uv");
  return g;
}

/* ------------------------------------------------------------ textures */

const DEVANAGARI =
  '"Nirmala UI", "Noto Sans Devanagari", "Kohinoor Devanagari", "Devanagari Sangam MN", Mangal, system-ui, sans-serif';

/** Seeded random, so the scenery looks the same on every visit. */
export const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

export class Textures {
  private all: Texture[] = [];
  constructor(private aniso: number) {}

  canvas(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true, repeat = false) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!, w, h);
    const t = new CanvasTexture(c);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = this.aniso;
    if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
    this.all.push(t);
    return t;
  }

  dispose() {
    this.all.forEach((t) => t.dispose());
  }
}

/** Speckled noise over a base colour (ballast, asphalt). */
export const noise = (g: CanvasRenderingContext2D, w: number, h: number, base: string, dots: string[], n: number, size: number, seed: number) => {
  const r = rng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    g.fillStyle = dots[i % dots.length];
    g.globalAlpha = 0.25 + r() * 0.55;
    const s = size * (0.4 + r());
    g.beginPath();
    g.ellipse(r() * w, r() * h, s, s * (0.6 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
};

export const text = (
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 800,
  family = DEVANAGARI
) => {
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${weight} ${size}px ${family}`;
  g.fillText(s, x, y);
};

/** Soft round blob (shadows, glows, sparkles): white with alpha falloff. */
export const radial = (g: CanvasRenderingContext2D, w: number, h: number, stops: [number, number][]) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  stops.forEach(([at, a]) => gr.addColorStop(at, `rgba(255,255,255,${a})`));
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
};

export const roundRect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};
