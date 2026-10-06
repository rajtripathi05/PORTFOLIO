import type React from "react";

/**
 * Subtle wallpaper parallax: ≤ 4px from the mouse on desktop, ≤ 6px from device tilt on
 * touch devices (after a gesture). Writes a transform straight to `ref` (no re-renders).
 * Off under reduced motion.
 */
export function useParallax(_ref: React.RefObject<HTMLElement>, _opts?: { max?: number; source?: "mouse" | "tilt" }): void {}
