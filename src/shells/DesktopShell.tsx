import { AnimatePresence, motion } from "framer-motion";
import { duration, ease } from "~/styles/motion";
import { apps } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import { DOCK_RESERVE, MENU_BAR_HEIGHT, storage } from "~/utils";
import { hasEscapeHandlers } from "~/hooks/useEscape";
import { feedback } from "~/sensory/feedback";
import { useParallax } from "~/sensory/parallax";
import Spotlight from "~/features/spotlight/Spotlight";
import MenuBar from "./desktop/MenuBar";
import DesktopIcons from "./desktop/DesktopIcons";
import AppWindow from "./desktop/AppWindow";
import FloatingPanel from "./desktop/FloatingPanel";
import Dock from "./desktop/Dock";
import Launchpad from "./desktop/Launchpad";
import ShellContextMenu from "./desktop/ShellContextMenu";
import Welcome from "./shared/Welcome";
import HelpPanel from "./shared/HelpPanel";
import Credits from "./shared/Credits";
import OfflineNotice from "./shared/OfflineNotice";
import Toast from "./shared/Toast";
import { TourLayer } from "~/features/tour";
import { showStartHint } from "./shared/startHint";

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

export default function DesktopShell() {
  const windows = useStore((s) => s.windows);
  const wallpaperId = useStore((s) => s.wallpaper);
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const openApp = useStore((s) => s.openApp);
  const revealed = useStore((s) => s.revealed);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const reduced = useReducedMotion();

  const deepLinked = useShellSetup();
  const wallpaper = getWallpaper(wallpaperId);
  const wallpaperRef = useRef<HTMLDivElement>(null);
  useParallax(wallpaperRef, { max: 4, source: "mouse" });

  // First visit: welcome card 300ms after the desktop reveal finishes (not for deep links).
  useEffect(() => {
    if (!revealed || storage.get("welcomed") === "1") return;
    if (deepLinked) {
      storage.set("welcomed", "1");
      return;
    }
    const t = setTimeout(() => setOverlay("welcome"), 700 + 300);
    return () => clearTimeout(t);
  }, [revealed]);

  useEffect(() => {
    if (overlay === "spotlight") feedback("spotlight");
  }, [overlay]);

  const dismissWelcome = () => {
    storage.set("welcomed", "1");
    setOverlay(null);
  };
  const finishWelcome = () => {
    dismissWelcome();
    openApp("about");
    showStartHint("projects");
  };

  // Global shortcuts. Escape closes the front window when nothing else (menu, dialog,
  // viewer) has claimed it. ⌘W / Ctrl+W also closes it where the browser allows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useStore.getState();
      if (!state.revealed) return; // the boot screen handles keys itself
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "k") {
        e.preventDefault();
        state.toggleOverlay("spotlight");
      } else if (mod && key === "m") {
        if (state.focusedId) {
          e.preventDefault();
          state.minimizeApp(state.focusedId);
        }
      } else if (mod && key === "w") {
        if (state.focusedId) {
          e.preventDefault();
          state.closeApp(state.focusedId);
        }
      } else if (e.key === "?" && !mod && !isTyping(document.activeElement) && !hasEscapeHandlers()) {
        e.preventDefault();
        feedback("tap");
        setOverlay("help");
      } else if (e.key === "Escape" && !e.defaultPrevented && !hasEscapeHandlers()) {
        state.closeFocused();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeOverlay = () => {
    feedback("close");
    setOverlay(null);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onContextMenu={(e) => {
        // Only the bare desktop: windows, menus and the dock keep their own behaviour.
        if ((e.target as HTMLElement).closest(".window, header, nav, [role=dialog], [role=menu]")) return;
        e.preventDefault();
        feedback("tap");
        setContextMenu({ kind: "desktop", x: e.clientX, y: e.clientY });
      }}
    >
      {/* Reveal: wallpaper fades in → menu bar slides down → dock rises (< 700ms in total). */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: reduced ? duration.standard : duration.emphasis, ease: ease.standard }}
      >
        <div
          ref={wallpaperRef}
          className="absolute -inset-2 will-change-transform"
          style={{ background: wallpaper.background }}
        />
      </motion.div>

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
        {overlay === "welcome" && <Welcome key="welcome" onStart={finishWelcome} onDismiss={dismissWelcome} />}
        {overlay === "help" && <HelpPanel key="help" onClose={closeOverlay} />}
        {overlay === "credits" && <Credits key="credits" onClose={closeOverlay} />}
        {overlay === "spotlight" && <Spotlight key="spotlight" onClose={() => setOverlay(null)} />}
        {overlay === "launchpad" && <Launchpad key="launchpad" onClose={closeOverlay} />}
      </AnimatePresence>

      <ShellContextMenu />
      <OfflineNotice />
      <Toast />
      <TourLayer />
    </div>
  );
}
