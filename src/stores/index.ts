import { create } from "zustand";
import { createSystemSlice, type SystemSlice } from "./slices/system";
import { createUISlice, type UISlice } from "./slices/ui";
import { createWindowsSlice, type WindowsSlice } from "./slices/windows";

export const useStore = create<SystemSlice & UISlice & WindowsSlice>((...a) => ({
  ...createSystemSlice(...a),
  ...createUISlice(...a),
  ...createWindowsSlice(...a)
}));
