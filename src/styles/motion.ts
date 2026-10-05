/**
 * Motion tokens for Framer Motion. Mirrors --duration-* / --ease-* in tokens.css
 * (Framer needs numbers, not CSS variables). Under reduced motion, components swap
 * transforms for plain fades and these durations still apply to the fade.
 */
export const duration = {
  micro: 0.12,
  standard: 0.2,
  emphasis: 0.32,
  /** Dock launch bounce. */
  bounce: 0.72
} as const;

export const ease = {
  standard: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  in: [0.4, 0, 0.6, 1] as [number, number, number, number]
};

/** Spring-like curves for windows, panels, sheets and the dock. */
export const spring = {
  window: { type: "spring", stiffness: 420, damping: 34, mass: 0.8 },
  panel: { type: "spring", stiffness: 380, damping: 32, mass: 0.85 },
  sheet: { type: "spring", stiffness: 380, damping: 38, mass: 0.9 },
  popover: { type: "spring", stiffness: 500, damping: 36 },
  /** Dock magnification follow (very stiff, no overshoot). */
  dock: { stiffness: 1700, damping: 90 }
} as const;

export const fade = { duration: duration.standard, ease: ease.standard };
export const fadeFast = { duration: duration.micro, ease: ease.standard };
