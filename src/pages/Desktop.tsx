import { AnimatePresence } from "framer-motion";
import { apps } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import { DOCK_RESERVE, MENU_BAR_HEIGHT, storage } from "~/utils";
import { hasEscapeHandlers } from "~/hooks/useEscape";

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

export default function Desktop() {
  const windows = useStore((s) => s.windows);
  const dark = useStore((s) => s.dark);
  const wallpaperId = useStore((s) => s.wallpaper);
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  const closeFocused = useStore((s) => s.closeFocused);
  const minimizeApp = useStore((s) => s.minimizeApp);
  const openApp = useStore((s) => s.openApp);
  const setDockHint = useStore((s) => s.setDockHint);

  const deepLinked = useShellSetup();
  const wallpaper = getWallpaper(wallpaperId);

  // First visit: welcome card shortly after the desktop appears (not for deep links).
  useEffect(() => {
    if (storage.get("welcomed") === "1") return;
    if (deepLinked) {
      storage.set("welcomed", "1");
      return;
    }
    const t = setTimeout(() => setOverlay("welcome"), 450);
    return () => clearTimeout(t);
  }, []);

  const finishWelcome = () => {
    storage.set("welcomed", "1");
    setOverlay(null);
    openApp("about");
    if (storage.get("hintShown") === "1") return;
    storage.set("hintShown", "1");
    // One-time "Start here" ring on the Projects dock icon; cleared by the next app launch.
    const startCount = useStore.getState().openCount;
    setTimeout(() => setDockHint("projects"), 700);
    const unsub = useStore.subscribe((s) => {
      if (s.openCount > startCount) {
        setDockHint(null);
        unsub();
      }
    });
    setTimeout(() => {
      setDockHint(null);
      unsub();
    }, 7000);
  };

  // Global shortcuts. Escape closes the front window when nothing else (menu, dialog,
  // viewer) has claimed it. ⌘W / Ctrl+W can't be intercepted by web pages, so it isn't used.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleOverlay("spotlight");
      } else if (mod && e.key.toLowerCase() === "m") {
        const id = useStore.getState().focusedId;
        if (id) {
          e.preventDefault();
          minimizeApp(id);
        }
      } else if (e.key === "?" && !mod && !isTyping(document.activeElement) && !hasEscapeHandlers()) {
        e.preventDefault();
        setOverlay("help");
      } else if (e.key === "Escape" && !e.defaultPrevented && !hasEscapeHandlers()) {
        closeFocused();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeOverlay = () => setOverlay(null);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper.background }}>
      <a
        href="/quick"
        className="sr-only z-[300] rounded-button bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-3 focus:top-10"
      >
        Skip to Quick View
      </a>

      <MenuBar />
      <DesktopIcons />

      <main
        id="window-area"
        aria-label="Desktop"
        className="pointer-events-none fixed inset-x-0 z-10"
        style={{ top: MENU_BAR_HEIGHT, bottom: DOCK_RESERVE }}
      >
        <AnimatePresence>
          {apps
            .filter((app) => !app.floating && windows[app.id]?.open)
            .map((app) => (
              <AppWindow key={app.id} app={app} />
            ))}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {apps
          .filter((app) => app.floating && windows[app.id]?.open)
          .map((app) => (
            <FloatingPanel key={app.id} app={app} />
          ))}
      </AnimatePresence>

      <Dock />

      <AnimatePresence>
        {overlay === "welcome" && <Welcome key="welcome" onStart={finishWelcome} />}
        {overlay === "help" && <HelpPanel key="help" onClose={closeOverlay} />}
        {overlay === "credits" && <Credits key="credits" onClose={closeOverlay} />}
        {overlay === "spotlight" && <Spotlight key="spotlight" onClose={closeOverlay} />}
        {overlay === "launchpad" && <Launchpad key="launchpad" onClose={closeOverlay} />}
      </AnimatePresence>

      <Toast />
    </div>
  );
}
