import { storage } from "~/utils";

/**
 * Subtle haptic feedback via the Vibration API (Android Chrome; iOS Safari doesn't
 * support it, so this is a silent no-op there). On by default; visitors can turn it
 * off in View → Haptic Feedback.
 */
export type HapticKind = "tap" | "open" | "close" | "success" | "achievement";

const patterns: Record<HapticKind, number | number[]> = {
  tap: 6,
  open: 10,
  close: [6],
  success: [8, 40, 12],
  achievement: [10, 60, 10, 60, 18]
};

export const hapticsSupported = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

export const hapticsEnabled = (): boolean => storage.get("haptics") !== "off";

export const setHapticsEnabled = (on: boolean): void => storage.set("haptics", on ? "on" : "off");

export const haptic = (kind: HapticKind): void => {
  if (!hapticsSupported() || !hapticsEnabled()) return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* some browsers throw when called without a user gesture — ignore */
  }
};
