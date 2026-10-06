import type { AppId } from "~/types";
import { useStore } from "~/stores";
import { storage } from "~/utils/storage";

/**
 * One-time "Start here" ring on an app launcher (the Projects dock icon / home-screen icon).
 * Shown once per visitor, ~700ms after the welcome card closes; cleared by the next app
 * launch or after 7s. Shell-agnostic: launchers read `dockHint` from the store.
 */
export function showStartHint(app: AppId = "projects"): void {
  if (storage.get("hintShown") === "1") return;
  storage.set("hintShown", "1");
  const { setDockHint } = useStore.getState();
  const startCount = useStore.getState().openCount;
  const show = setTimeout(() => setDockHint(app), 700);
  const unsub = useStore.subscribe((s) => {
    if (s.openCount > startCount) clear();
  });
  const clear = () => {
    clearTimeout(show);
    clearTimeout(timeout);
    setDockHint(null);
    unsub();
  };
  const timeout = setTimeout(clear, 7000);
}
