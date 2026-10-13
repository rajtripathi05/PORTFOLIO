import { installWallpapers } from "~/configs/wallpapers";
import { trackNightLights } from "./NightLights";

export { default as LiquidFilters } from "./LiquidFilters";
export { NightLights } from "./NightLights";

/** "clear" (default, like iOS 26) or "tinted" (more opaque, easier to read). */
export type GlassStyle = "clear" | "tinted";

/**
 * Edge refraction needs SVG filters in backdrop-filter, which only Chromium renders.
 * Safari and Firefox parse `backdrop-filter: url()` but drop the whole effect (blur
 * included), so the lens is switched on by brand, not by CSS.supports().
 */
export const supportsLens = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData
    ?.brands;
  return !!brands?.some((b) => /Chromium/i.test(b.brand));
};

export const applyGlassStyle = (style: GlassStyle): void => {
  document.documentElement.dataset.glass = style;
};

/**
 * Moves the specular rim of every glass surface toward the light: the pointer on
 * desktop, device tilt on phones and tablets (where the browser reports it). Off
 * under reduced motion; the rim then stays lit from the top-left.
 */
const trackLight = (): void => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  let raf = 0;
  let next = 315;
  let last = 315;
  const commit = () => {
    raf = 0;
    if (Math.abs(next - last) < 1.5) return;
    last = next;
    root.style.setProperty("--light-angle", `${next.toFixed(1)}deg`);
  };
  const schedule = (deg: number) => {
    next = (deg + 360) % 360;
    if (!raf) raf = requestAnimationFrame(commit);
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;
      schedule((Math.atan2(dx, -dy) * 180) / Math.PI);
    },
    { passive: true }
  );
  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma == null) return;
      schedule(315 + Math.max(-40, Math.min(40, e.gamma)) * 1.6);
    },
    { passive: true }
  );
};

/** Called once at startup (not on Quick View): wallpapers, lens support and the light. */
export function initGlass(): void {
  if (typeof window === "undefined") return;
  installWallpapers();
  document.documentElement.dataset.lens = supportsLens() ? "on" : "off";
  trackLight();
  trackNightLights();
}
