import type React from "react";
import { useClickOutside } from "~/hooks/useClickOutside";
import { motion, useMotionValue } from "framer-motion";
import { duration, ease } from "~/styles/motion";
import { apps, launchpadIcon, type AppId } from "~/configs/apps";
import AppIcon from "~/components/AppIcon";
import { useEscape } from "~/hooks/useEscape";
import { feedback } from "~/sensory/feedback";

// The dock shows these; everything else lives in the "More" stack (an open app always shows too).
const PRIMARY: AppId[] = ["about", "projects", "experience", "achievements", "assistant", "resume", "contact", "safari"];
const moreIcon = { ...launchpadIcon, glyph: "i-ph:dots-three-circle-fill" };
import { isTouchDevice } from "~/utils";
import DockItem from "./DockItem";

export default function Dock() {
  const windows = useStore((s) => s.windows);
  const openApp = useStore((s) => s.openApp);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const overlay = useStore((s) => s.overlay);
  const dockHint = useStore((s) => s.dockHint);
  const { winWidth } = useWindowSize();
  const reduced = useReducedMotion();
  const revealed = useStore((s) => s.revealed);

  const mouseX = useMotionValue<number | null>(null);
  const magnify = !reduced && !isTouchDevice();
  // Shrink icons on narrower desktops so every labelled icon still fits.
  const size = winWidth < 1000 ? 38 : winWidth < 1200 ? 44 : 48;
  const mag = 1.55;
  // Roving tabindex: the dock is one Tab stop; arrow keys move between icons.
  const [focusIndex, setFocusIndex] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useClickOutside(moreRef, () => setMoreOpen(false));
  useEscape(() => setMoreOpen(false), moreOpen);
  const overflow = apps.filter((a) => !PRIMARY.includes(a.id));
  const dockApps = apps.filter((a) => PRIMARY.includes(a.id) || windows[a.id]?.open);
  const moreIndex = dockApps.length + 1;
  const onToolbarKeyDown = (e: React.KeyboardEvent) => {
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-dock-btn]"));
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const to =
      e.key === "ArrowRight" ? (i + 1) % buttons.length
      : e.key === "ArrowLeft" ? (i - 1 + buttons.length) % buttons.length
      : e.key === "Home" ? 0
      : e.key === "End" ? buttons.length - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    buttons[to].focus();
    setFocusIndex(to);
  };

  return (
    <motion.nav
      aria-label="Dock"
      className="fixed inset-x-0 bottom-2 z-30 flex justify-center px-2"
      initial={reduced ? { opacity: 0 } : { y: 110 }}
      animate={revealed ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: duration.emphasis, ease: ease.standard, delay: 0.2 }}
    >
      <div
        role="toolbar"
        aria-label="Apps"
        aria-orientation="horizontal"
        onKeyDown={onToolbarKeyDown}
        className="dock-bar material-menubar max-w-full"
        onMouseMove={(e) => magnify && mouseX.set(e.nativeEvent.x)}
        onMouseLeave={() => mouseX.set(null)}
      >
        <DockItem
          id="launchpad"
          title="Launchpad"
          icon={launchpadIcon}
          isOpen={overlay === "launchpad"}
          launches={0}
          mouseX={mouseX}
          magnify={magnify}
          bounce={false}
          size={size}
          mag={mag}
          onOpen={() => toggleOverlay("launchpad")}
          index={0}
          revealed={revealed}
          reduced={reduced}
          tabIndex={focusIndex === 0 ? 0 : -1}
          onFocusItem={() => setFocusIndex(0)}
        />
        <div className="dock-sep" role="separator" aria-orientation="vertical" />
        {dockApps.map((app, i) => (
          <DockItem
            key={app.id}
            id={app.id}
            title={app.title}
            icon={app.icon}
            isOpen={!!windows[app.id]?.open}
            launches={windows[app.id]?.launches ?? 0}
            mouseX={mouseX}
            magnify={magnify}
            bounce={!reduced}
            size={size}
            mag={mag}
            hint={dockHint === app.id}
            index={i + 1}
            revealed={revealed}
            reduced={reduced}
            tabIndex={focusIndex === i + 1 ? 0 : -1}
            onFocusItem={() => setFocusIndex(i + 1)}
            prefetch={() => void app.load()}
            onOpen={() => {
              setOverlay(null);
              openApp(app.id);
            }}
          />
        ))}
        <div ref={moreRef} className="relative flex">
          {moreOpen && (
            <div role="menu" aria-label="More apps" className="dock-more material-popover">
              {overflow.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  role="menuitem"
                  data-tour-id={app.id}
                  className="dock-more-item"
                  onClick={() => {
                    setMoreOpen(false);
                    setOverlay(null);
                    openApp(app.id);
                  }}
                  onMouseEnter={() => void app.load()}
                >
                  <AppIcon icon={app.icon} size={36} />
                  <span>{app.title}</span>
                </button>
              ))}
            </div>
          )}
          <DockItem
            id="more"
            title="More"
            icon={moreIcon}
            isOpen={false}
            launches={0}
            mouseX={mouseX}
            magnify={magnify}
            bounce={false}
            size={size}
            mag={mag}
            index={moreIndex}
            revealed={revealed}
            reduced={reduced}
            tabIndex={focusIndex === moreIndex ? 0 : -1}
            onFocusItem={() => setFocusIndex(moreIndex)}
            onOpen={() => {
              feedback("toggle");
              setMoreOpen((o) => !o);
            }}
          />
        </div>
      </div>
    </motion.nav>
  );
}
