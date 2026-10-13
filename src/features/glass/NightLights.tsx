/**
 * Lit windows for skyline wallpapers (Mumbai Night). The wallpaper itself is a data-URI
 * SVG and can't read CSS variables, so the windows are their own decorative layer whose
 * opacity follows `--lit` (0–1) on <html>, set from the visitor's local hour.
 */
import type { Wallpaper } from "~/configs/wallpapers";

const ramp = (h: number, h0: number, h1: number, a: number, b: number) => a + ((h - h0) / (h1 - h0)) * (b - a);

/** Day 0.15 (6–17), dusk ramp 17–20, full 20–23, easing to 0.3 by 1, back to day by 6. */
export const litForHour = (h: number): number => {
  if (h >= 6 && h < 17) return 0.15;
  if (h >= 17 && h < 20) return ramp(h, 17, 20, 0.15, 1);
  if (h >= 20 && h < 23) return 1;
  if (h >= 23) return ramp(h, 23, 25, 1, 0.3);
  if (h < 1) return ramp(h + 24, 23, 25, 1, 0.3);
  if (h < 5) return 0.3;
  return ramp(h, 5, 6, 0.3, 0.15);
};

/** Sets `--lit` now, every 5 minutes, and when the tab comes back. */
export function trackNightLights(): void {
  const set = () => {
    const d = new Date();
    const lit = litForHour(d.getHours() + d.getMinutes() / 60);
    document.documentElement.style.setProperty("--lit", lit.toFixed(2));
  };
  set();
  setInterval(set, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && set());
}

/** The overlay, rendered inside the wallpaper layer (so it shares its framing and parallax). */
export function NightLights({ wallpaper }: { wallpaper: Wallpaper }) {
  if (!wallpaper.skyline) return null;
  const style = {
    "--wp-lights": `var(--wp-${wallpaper.id}-windows)`,
    "--wp-twinkle": `var(--wp-${wallpaper.id}-twinkle)`
  } as React.CSSProperties;
  return <div className="wp-lights" style={style} aria-hidden="true" />;
}
