import type { StateCreator } from "zustand";
import type { AppId, AppParams } from "~/types";
import { feedback } from "~/sensory/feedback";

export interface WindowState {
  open: boolean;
  min: boolean;
  max: boolean;
  z: number;
  /** Open params, e.g. { id: "nsu" } to select a project. */
  params?: AppParams;
  /** Increments on every openApp call so apps can react to repeated opens. */
  nonce: number;
  /** Order in which the window was opened, used for cascading positions. */
  order: number;
  /** Bumps when the app is launched from closed, used for the dock bounce. */
  launches: number;
}

export interface WindowsSlice {
  windows: Partial<Record<AppId, WindowState>>;
  focusedId: AppId | null;
  topZ: number;
  openCount: number;
  openApp: (id: AppId, params?: AppParams) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  toggleMaxApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  closeFocused: () => boolean;
}

const topVisible = (
  windows: WindowsSlice["windows"],
  except?: AppId
): AppId | null => {
  let best: AppId | null = null;
  let z = -1;
  (Object.keys(windows) as AppId[]).forEach((id) => {
    const w = windows[id]!;
    if (id !== except && w.open && !w.min && w.z > z) {
      z = w.z;
      best = id;
    }
  });
  return best;
};

export const createWindowsSlice: StateCreator<WindowsSlice> = (set, get) => ({
  windows: {},
  focusedId: null,
  topZ: 10,
  openCount: 0,

  openApp: (id, params) =>
    set((state) => {
      const prev = state.windows[id];
      const z = state.topZ + 1;
      const wasOpen = !!prev?.open;
      feedback(wasOpen ? "tap" : "open");
      return {
        topZ: z,
        focusedId: id,
        openCount: wasOpen ? state.openCount : state.openCount + 1,
        windows: {
          ...state.windows,
          [id]: {
            open: true,
            min: false,
            max: prev?.open ? prev.max : false,
            z,
            params: params ?? (wasOpen ? prev?.params : undefined),
            nonce: (prev?.nonce ?? 0) + 1,
            order: wasOpen ? prev!.order : state.openCount,
            launches: (prev?.launches ?? 0) + (wasOpen ? 0 : 1)
          }
        }
      };
    }),

  closeApp: (id) =>
    set((state) => {
      const prev = state.windows[id];
      if (!prev) return {};
      feedback("close");
      const windows = { ...state.windows, [id]: { ...prev, open: false, min: false, max: false } };
      return { windows, focusedId: topVisible(windows) };
    }),

  minimizeApp: (id) =>
    set((state) => {
      const prev = state.windows[id];
      if (!prev) return {};
      feedback("minimize");
      const windows = { ...state.windows, [id]: { ...prev, min: true } };
      return { windows, focusedId: topVisible(windows) };
    }),

  toggleMaxApp: (id) =>
    set((state) => {
      const prev = state.windows[id];
      if (!prev) return {};
      return { windows: { ...state.windows, [id]: { ...prev, max: !prev.max } } };
    }),

  focusApp: (id) =>
    set((state) => {
      const prev = state.windows[id];
      if (!prev || state.focusedId === id) return {};
      const z = state.topZ + 1;
      return {
        topZ: z,
        focusedId: id,
        windows: { ...state.windows, [id]: { ...prev, z } }
      };
    }),

  closeFocused: () => {
    const id = get().focusedId ?? topVisible(get().windows);
    if (!id) return false;
    get().closeApp(id);
    return true;
  }
});
