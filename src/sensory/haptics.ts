import type { HapticName } from "~/types";

/**
 * Vibration API patterns. Android Chrome supports them; iPhone Safari and desktops
 * don't, so this fails silently there and visual micro-feedback carries the response.
 */
const PATTERNS: Record<HapticName, number[]> = {
  light: [8],
  medium: [14],
  heavy: [22],
  success: [10, 40, 18],
  warning: [18, 60, 18],
  selection: [5]
};

export const hapticsSupported = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export const vibrate = (name: HapticName): void => {
  if (!hapticsSupported()) return;
  try {
    navigator.vibrate(PATTERNS[name]);
  } catch {
    /* some browsers throw without a user gesture — ignore */
  }
};
