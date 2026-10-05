import type { StateCreator } from "zustand";

export type Overlay = "spotlight" | "launchpad" | "help" | "credits" | "welcome" | null;

export interface UISlice {
  overlay: Overlay;
  openMenu: string | null;
  toast: { id: number; text: string } | null;
  /** Dock icon that shows the one-time "Start here" hint. */
  dockHint: string | null;
  setOverlay: (o: Overlay) => void;
  toggleOverlay: (o: Exclude<Overlay, null>) => void;
  setOpenMenu: (m: string | null) => void;
  showToast: (text: string) => void;
  setDockHint: (id: string | null) => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  overlay: null,
  openMenu: null,
  toast: null,
  dockHint: null,
  setOverlay: (overlay) => set({ overlay, openMenu: null }),
  toggleOverlay: (o) => set({ overlay: get().overlay === o ? null : o, openMenu: null }),
  setOpenMenu: (openMenu) => set({ openMenu }),
  showToast: (text) => {
    const id = Date.now();
    set({ toast: { id, text } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 2200);
  },
  setDockHint: (dockHint) => set({ dockHint })
});
