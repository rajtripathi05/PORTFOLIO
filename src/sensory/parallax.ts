import { useEffect } from "react";
import type React from "react";

/**
 * Subtle wallpaper parallax: ≤ 4px from the mouse on desktop, ≤ 6px from device tilt on
 * touch devices (after a gesture). Writes a transform straight to `ref` (no re-renders).
 * Off under reduced motion.
 */
export function useParallax(
  ref: React.RefObject<HTMLElement>,
  { max = 4, source = "mouse" }: { max?: number; source?: "mouse" | "tilt" } = {}
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const apply = (x: number, y: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${(x * max).toFixed(2)}px, ${(y * max).toFixed(2)}px, 0)`;
      });
    };
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const onMouse = (e: MouseEvent) => apply(-(e.clientX / window.innerWidth - 0.5) * 2, -(e.clientY / window.innerHeight - 0.5) * 2);
    const onTilt = (e: DeviceOrientationEvent) => apply(clamp((e.gamma ?? 0) / 30), clamp(((e.beta ?? 45) - 45) / 30));

    if (source === "mouse") window.addEventListener("mousemove", onMouse, { passive: true });
    else window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("deviceorientation", onTilt);
      el.style.transform = "";
    };
  }, [ref, max, source]);
}
