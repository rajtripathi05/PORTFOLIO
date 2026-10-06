import { createContext, useContext, useEffect, useRef } from "react";
import type { AppHost } from "~/types";

/**
 * The bridge between an app and the shell hosting it (desktop window, tablet page or
 * phone sheet). Apps never import shell code; they only read this context.
 */
export const AppHostContext = createContext<AppHost>({
  id: "about",
  shell: "desktop",
  width: 800,
  nonce: 0,
  close: () => {}
});

/** The current app's host: shell kind, content width, open params and close(). */
export const useAppHost = (): AppHost => useContext(AppHostContext);

/**
 * In-app back navigation for list → detail layouts. While `active`, the phone and
 * tablet shells show "‹ {label}" and route the browser/Android back button to
 * `onBack`. It does nothing on the desktop.
 */
export function useAppBack(active: boolean, label: string, onBack: () => void): void {
  const { pushBack } = useAppHost();
  const handler = useRef(onBack);
  handler.current = onBack;

  useEffect(() => {
    if (!active || !pushBack) return;
    return pushBack({ label, onBack: () => handler.current() });
  }, [active, label, pushBack]);
}
