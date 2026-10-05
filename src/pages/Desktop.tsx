import { AnimatePresence } from "framer-motion";
import { apps } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import { DOCK_RESERVE, MENU_BAR_HEIGHT } from "~/utils";
import { hasEscapeHandlers } from "~/hooks/useEscape";

export default function Desktop() {
  const windows = useStore((s) => s.windows);
  const dark = useStore((s) => s.dark);
  const wallpaperId = useStore((s) => s.wallpaper);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  const closeFocused = useStore((s) => s.closeFocused);
  const syncSystemTheme = useStore((s) => s.syncSystemTheme);

  const wallpaper = getWallpaper(wallpaperId);

  // Follow the OS theme while the visitor hasn't picked one.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener("change", syncSystemTheme);
    return () => mq?.removeEventListener("change", syncSystemTheme);
  }, []);

  // Global shortcuts: ⌘K / Ctrl+K opens search; Escape closes the front window
  // when no menu, dialog or lightbox is open (those handle Escape themselves).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleOverlay("spotlight");
      } else if (e.key === "Escape" && !e.defaultPrevented && !hasEscapeHandlers()) {
        closeFocused();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: dark ? wallpaper.dark : wallpaper.light }}
    >
      <MenuBar />

      <main
        id="window-area"
        aria-label="Desktop"
        className="fixed inset-x-0 z-10 pointer-events-none"
        style={{ top: MENU_BAR_HEIGHT, bottom: DOCK_RESERVE }}
      >
        <AnimatePresence>
          {apps
            .filter((app) => windows[app.id]?.open)
            .map((app) => (
              <AppWindow key={app.id} app={app} />
            ))}
        </AnimatePresence>
      </main>

      <Dock />
      <Toast />
    </div>
  );
}
