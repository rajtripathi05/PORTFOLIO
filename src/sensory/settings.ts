import { create } from "zustand";
import type { SensoryPrefs } from "~/types";
import { storage } from "~/utils/storage";

const KEY = "sensory";

const matches = (q: string) => typeof window !== "undefined" && !!window.matchMedia?.(q).matches;

const defaults = (): SensoryPrefs => ({
  muted: false,
  volume: 0.3,
  // Reduced motion defaults UI sounds to off.
  ui: !matches("(prefers-reduced-motion: reduce)"),
  ambient: false,
  ambientVolume: 0.5,
  typing: false,
  // On by default on touch devices only.
  haptics: matches("(pointer: coarse)")
});

const load = (): SensoryPrefs => {
  try {
    const saved = JSON.parse(storage.get(KEY) ?? "null") as Partial<SensoryPrefs> | null;
    // Ambient never starts on its own: it is opt-in on every visit.
    return { ...defaults(), ...saved, ambient: false };
  } catch {
    return defaults();
  }
};

export interface SensoryStore extends SensoryPrefs {
  setPrefs: (patch: Partial<SensoryPrefs>) => void;
  toggleMute: () => void;
}

/**
 * Visitor sound & haptics preferences. UI code only writes here; the sound engine
 * (src/sensory) subscribes and reacts (e.g. starts/stops the ambient pad).
 */
export const useSensory = create<SensoryStore>((set, get) => ({
  ...load(),
  setPrefs: (patch) => {
    set(patch);
    const { setPrefs, toggleMute, ambient, ...prefs } = get();
    storage.set(KEY, JSON.stringify(prefs));
  },
  toggleMute: () => get().setPrefs({ muted: !get().muted })
}));
