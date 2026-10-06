import type { AmbientEngine } from "./engine";

/**
 * Thin, lazy wrapper around the ambient engine: the Web Audio code is only
 * downloaded when the visitor turns sound on (always from a click — browsers
 * block audio that starts on its own, and the site never autoplays).
 */
let engine: AmbientEngine | null = null;
let loading: Promise<AmbientEngine> | null = null;

const getEngine = () => {
  if (engine) return Promise.resolve(engine);
  loading ??= import("./engine").then((m) => (engine = new m.AmbientEngine()));
  return loading;
};

export const soundSupported = (): boolean =>
  typeof window !== "undefined" && !!(window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);

export const startAmbient = async (): Promise<void> => {
  if (!soundSupported()) return;
  await (await getEngine()).start();
};

export const stopAmbient = async (): Promise<void> => {
  if (engine) await engine.stop();
};

/** Plays an achievement's motif if sound is on (no-op otherwise). */
export const playAchievementMotif = (id: string): void => {
  engine?.playMotif(id);
};
