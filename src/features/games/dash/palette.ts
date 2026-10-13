/** Mumbai Local Dash colours: every one is a design token (tokens.css), read once per run. */
import { Color, Vector3 } from "three";

const STAGE_KEYS = ["top", "horizon", "sun", "hemi", "fill", "skyline", "sea"] as const;
const STAGE_IDS = ["dadar", "marine", "link"] as const;

export const DASH_TOKENS = [
  ...STAGE_IDS.flatMap((s) => STAGE_KEYS.map((k) => `dash-${s}-${k}` as const)),
  "dash-rim", "dash-window-lit",
  "dash-ballast", "dash-ballast-2", "dash-sleeper", "dash-rail", "dash-bed", "dash-asphalt", "dash-asphalt-2", "dash-lane-paint",
  "dash-platform", "dash-platform-2", "dash-platform-side", "dash-edge-yellow", "dash-edge-black", "dash-pillar", "dash-roof",
  "dash-roof-under", "dash-board", "dash-board-ink", "dash-bench", "dash-wire", "dash-ad-1", "dash-ad-2", "dash-ad-3", "dash-ad-4",
  "dash-ad-ink", "dash-promenade", "dash-seawall", "dash-lamp-pole", "dash-lamp", "dash-building", "dash-building-2",
  "dash-building-3", "dash-deck", "dash-deck-side", "dash-tower", "dash-cable", "dash-car-head", "dash-car-tail", "dash-rain",
  "dash-rick-body", "dash-rick-roof", "dash-rick-seat", "dash-wheel", "dash-hub", "dash-headlight", "dash-cart", "dash-crate",
  "dash-crate-2", "dash-veg-1", "dash-veg-2", "dash-veg-3", "dash-barrier", "dash-barrier-2", "dash-barrier-ink", "dash-train",
  "dash-train-cream", "dash-train-stripe", "dash-train-roof", "dash-window", "dash-door", "dash-warn",
  "dash-shirt", "dash-shirt-2", "dash-pants", "dash-skin", "dash-hair", "dash-backpack", "dash-backpack-2", "dash-shoe",
  "dash-sole", "dash-eye", "dash-chai-glass", "dash-chai", "dash-umbrella", "dash-handle", "dash-halo-chai",
  "dash-halo-umbrella", "dash-halo-fast", "dash-sparkle", "dash-blob",
  "vp-bun", "vp-bun-light", "vp-patty", "vp-chilli"
] as const;
export type DashColors = Record<(typeof DASH_TOKENS)[number], string>;

export const STAGES = ["Dadar", "Marine Drive", "Sea Link"] as const;

/** Everything about the light and air of a stage; blended between stages. */
export interface Palette {
  top: Color;
  horizon: Color;
  sun: Color;
  hemi: Color;
  fill: Color;
  skyline: Color;
  sea: Color;
  /** Direction to the sun/moon disc in the sky (drawn ahead of the runner). */
  sunDir: Vector3;
  sunI: number;
  hemiI: number;
  rimI: number;
  fogNear: number;
  fogFar: number;
  /** How lit the city windows are (0 day → 1 night). */
  night: number;
  exposure: number;
}

const DIRS = [new Vector3(-0.42, 0.2, -0.88), new Vector3(-0.75, 0.07, -0.66), new Vector3(0.45, 0.42, -0.79)];
const NUM = [
  // sunI hemiI rimI fogNear fogFar night exposure
  [2.3, 1.05, 0.7, 40, 175, 0, 1.0],
  [1.5, 0.95, 0.9, 34, 160, 0.55, 1.0],
  [0.55, 0.75, 1.2, 28, 150, 1, 1.15]
];

export function stagePalettes(C: DashColors): Palette[] {
  return STAGE_IDS.map((id, i) => {
    const col = (k: (typeof STAGE_KEYS)[number]) => new Color(C[`dash-${id}-${k}`]);
    const [sunI, hemiI, rimI, fogNear, fogFar, night, exposure] = NUM[i];
    return {
      top: col("top"),
      horizon: col("horizon"),
      sun: col("sun"),
      hemi: col("hemi"),
      fill: col("fill"),
      skyline: col("skyline"),
      sea: col("sea"),
      sunDir: DIRS[i].clone().normalize(),
      sunI,
      hemiI,
      rimI,
      fogNear,
      fogFar,
      night,
      exposure
    };
  });
}

export const clonePalette = (p: Palette): Palette => ({
  ...p,
  top: p.top.clone(),
  horizon: p.horizon.clone(),
  sun: p.sun.clone(),
  hemi: p.hemi.clone(),
  fill: p.fill.clone(),
  skyline: p.skyline.clone(),
  sea: p.sea.clone(),
  sunDir: p.sunDir.clone()
});

/** out = a→b at t, in place (no allocation per frame). */
export function lerpPalette(out: Palette, a: Palette, b: Palette, t: number): Palette {
  for (const k of ["top", "horizon", "sun", "hemi", "fill", "skyline", "sea"] as const) out[k].copy(a[k]).lerp(b[k], t);
  out.sunDir.copy(a.sunDir).lerp(b.sunDir, t).normalize();
  for (const k of ["sunI", "hemiI", "rimI", "fogNear", "fogFar", "night", "exposure"] as const) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
