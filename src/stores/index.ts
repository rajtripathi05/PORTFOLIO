import { create } from "zustand";
import type { OpenApp } from "~/types";
import { createSystemSlice, type SystemSlice } from "./slices/system";
import { createUISlice, type UISlice } from "./slices/ui";
import { createWindowsSlice, type WindowsSlice } from "./slices/windows";

export const useStore = create<SystemSlice & UISlice & WindowsSlice>((...a) => ({
  ...createSystemSlice(...a),
  ...createUISlice(...a),
  ...createWindowsSlice(...a)
}));

/** Opens (or brings forward) an app in whichever shell is active. Usable outside React. */
export const openApp: OpenApp = (id, params) => useStore.getState().openApp(id, params);
