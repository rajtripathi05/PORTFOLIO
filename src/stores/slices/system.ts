import type { StateCreator } from "zustand";
import { storage } from "~/utils";

export type ThemePref = "system" | "light" | "dark";

export interface SystemSlice {
  theme: ThemePref;
  dark: boolean;
  wallpaper: string;
  dockSize: number;
  dockMag: number;
  setTheme: (t: ThemePref) => void;
  toggleDark: () => void;
  syncSystemTheme: () => void;
  setWallpaper: (id: string) => void;
  setDockSize: (v: number) => void;
}

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const resolveDark = (t: ThemePref) => (t === "system" ? systemPrefersDark() : t === "dark");

const applyDark = (dark: boolean) => {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
};

const initialTheme = (storage.get("theme") as ThemePref | null) ?? "system";
const initialDark = resolveDark(initialTheme);
if (typeof document !== "undefined") applyDark(initialDark);

export const createSystemSlice: StateCreator<SystemSlice> = (set, get) => ({
  theme: initialTheme,
  dark: initialDark,
  wallpaper: storage.get("wallpaper") ?? "dusk",
  dockSize: 48,
  dockMag: 1.6,

  setTheme: (theme) => {
    storage.set("theme", theme);
    const dark = resolveDark(theme);
    applyDark(dark);
    set({ theme, dark });
  },
  toggleDark: () => get().setTheme(get().dark ? "light" : "dark"),
  syncSystemTheme: () => {
    if (get().theme !== "system") return;
    const dark = systemPrefersDark();
    applyDark(dark);
    set({ dark });
  },
  setWallpaper: (wallpaper) => {
    storage.set("wallpaper", wallpaper);
    set({ wallpaper });
  },
  setDockSize: (dockSize) => set({ dockSize })
});
