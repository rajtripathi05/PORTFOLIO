// localStorage can throw (private mode, blocked storage), so every access is guarded.
const PREFIX = "rt-portfolio:";

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(PREFIX + key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  }
};

/** Keys that make the boot screen, welcome card and "Start here" hint show only once. */
export const INTRO_KEYS = ["seenIntro", "welcomed", "hintShown"] as const;

/** Settings → "Reset intro": the next load plays the intro again. */
export const resetIntro = (): void => INTRO_KEYS.forEach((k) => storage.remove(k));
