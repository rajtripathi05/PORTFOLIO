import { createContext, useContext } from "react";
import type { AppId } from "~/configs/apps";

export interface WindowContextValue {
  id: AppId;
  /** Current content width in px (window or mobile sheet). */
  width: number;
  payload?: Record<string, unknown>;
  /** Changes on every open, so apps can re-apply the payload. */
  nonce: number;
  /** True inside the mobile full-screen sheet. */
  mobile: boolean;
}

export const WindowContext = createContext<WindowContextValue>({
  id: "about",
  width: 800,
  nonce: 0,
  mobile: false
});

export const useWindow = () => useContext(WindowContext);
