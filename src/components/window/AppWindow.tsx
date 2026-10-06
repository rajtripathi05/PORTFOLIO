import { Suspense } from "react";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import { DOCK_RESERVE, MENU_BAR_HEIGHT } from "~/utils";
import { duration, ease, spring } from "~/styles/motion";
import { WindowContext } from "./WindowContext";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Area = { w: number; h: number };

const GAP = 12;
const CASCADE = 24;
const SNAP_EDGE = 6;

const useArea = (): Area => {
  const { winWidth, winHeight } = useWindowSize();
  return { w: winWidth, h: Math.max(240, winHeight - MENU_BAR_HEIGHT - DOCK_RESERVE) };
};

// Keep the whole window inside the visible area (never off-screen or under the dock).
const clampRect = (r: Rect, area: Area): Rect => {
  const w = Math.min(r.w, area.w - GAP * 2);
  const h = Math.min(r.h, area.h - GAP);
  return {
    w,
    h,
    x: Math.min(Math.max(GAP, r.x), area.w - w - GAP),
    y: Math.min(Math.max(4, r.y), area.h - h - 4)
  };
};

// Where the most recently opened window was placed, for cascading the next one.
let lastPlaced: Rect | null = null;

// First window opens centred; each new one cascades 24px down-right from the last,
// falling back to centred when that would run off the visible area. Sized to fit.
const initialRect = (app: AppDef, area: Area, othersOpen: boolean): Rect => {
  const w = Math.min(app.width, area.w - GAP * 2);
  const h = Math.min(app.height, area.h - GAP);
  const centred = { w, h, x: (area.w - w) / 2, y: (area.h - h) / 2 };
  let rect = centred;
  if (othersOpen && lastPlaced) {
    // Keep the cascade if it fits horizontally (vertical overflow is clamped below).
    const next = { w, h, x: lastPlaced.x + CASCADE, y: lastPlaced.y + CASCADE };
    if (next.x + w <= area.w - GAP) rect = next;
  }
  rect = clampRect(rect, area);
  lastPlaced = rect;
  return rect;
};

/** Offset from a window's centre to its dock icon's centre (for genie-style open/minimize). */
const dockOffset = (appId: string, centreX: number, centreY: number) => {
  const dock = document.getElementById(`dock-${appId}`)?.getBoundingClientRect();
  if (!dock) return { x: 0, y: 160 };
  return { x: dock.left + dock.width / 2 - centreX, y: dock.top + dock.height / 2 - centreY };
};

interface TrafficLightsProps {
  title: string;
  max: boolean;
  onClose: () => void;
  onMin: () => void;
  onMax: () => void;
}

const TrafficLights = ({ title, max, onClose, onMin, onMax }: TrafficLightsProps) => (
  <div className="traffic no-drag" onDoubleClick={(e) => e.stopPropagation()}>
    <button type="button" aria-label={`Close ${title}`} title="Close (Esc)" onClick={onClose}>
      <span className="light is-close">
        <span className="i-ph:x-bold" />
      </span>
    </button>
    <button type="button" aria-label={`Minimize ${title}`} title="Minimize (⌘M / Ctrl+M)" onClick={onMin}>
      <span className="light is-min">
        <span className="i-ph:minus-bold" />
      </span>
    </button>
    <button
      type="button"
      aria-label={max ? `Restore ${title}` : `Maximize ${title}`}
      title={max ? "Restore" : "Maximize"}
      onClick={onMax}
    >
      <span className="light is-max">
        <span className={max ? "i-ph:arrows-in-simple-bold" : "i-ph:plus-bold"} />
      </span>
    </button>
  </div>
);

export default function AppWindow({ app }: { app: AppDef }) {
  const win = useStore((s) => s.windows[app.id])!;
  const focused = useStore((s) => s.focusedId === app.id);
  const closeApp = useStore((s) => s.closeApp);
  const minimizeApp = useStore((s) => s.minimizeApp);
  const toggleMaxApp = useStore((s) => s.toggleMaxApp);
  const focusApp = useStore((s) => s.focusApp);

  const area = useArea();
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  useReturnFocus(sectionRef, `#dock-${app.id}`);
  const [rect, setRect] = useState<Rect>(() => {
    const windows = useStore.getState().windows;
    const othersOpen = Object.entries(windows).some(([id, w]) => id !== app.id && w?.open && !w.min);
    return initialRect(app, area, othersOpen);
  });
  const [hidden, setHidden] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [snap, setSnap] = useState<"left" | "right" | null>(null);

  // Genie-lite open: start at the dock icon (computed once, from the target rect).
  const [openFrom] = useState(() =>
    dockOffset(app.id, rect.x + rect.w / 2, MENU_BAR_HEIGHT + rect.y + rect.h / 2)
  );

  // Briefly animate size/position changes (maximize, restore, snap) — never while dragging.
  const animateLayout = () => {
    if (reduced) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), duration.emphasis * 1000 + 60);
  };

  const firstMax = useRef(true);
  useEffect(() => {
    if (firstMax.current) {
      firstMax.current = false;
      return;
    }
    animateLayout();
  }, [win.max]);

  // Re-fit when the browser window is resized.
  useEffect(() => {
    setRect((r) => clampRect(r, area));
  }, [area.w, area.h]);

  // Move keyboard focus into the window whenever it is opened or re-opened.
  useEffect(() => {
    if (!win.min) sectionRef.current?.focus({ preventScroll: true });
  }, [win.nonce]);

  useEffect(() => {
    if (!win.min) setHidden(false);
  }, [win.min]);

  const shown: Rect = win.max ? { x: 0, y: 0, w: area.w, h: area.h } : rect;

  // Where the dock icon is, relative to the window centre (for the minimize animation).
  let minTarget = { x: 0, y: 160 };
  if (win.min && sectionRef.current) {
    const self = sectionRef.current.getBoundingClientRect();
    if (self.width > 0) minTarget = dockOffset(app.id, self.left + self.width / 2, self.top + self.height / 2);
  }

  const Content = app.component;
  const pointerX = (e: MouseEvent | TouchEvent) =>
    "touches" in e ? (e.touches[0] ?? e.changedTouches[0])?.clientX ?? 0 : e.clientX;

  return (
    <>
      {snap && (
        <div
          className="snap-preview"
          aria-hidden="true"
          style={{ left: snap === "left" ? 4 : area.w / 2 + 4, width: area.w / 2 - 8 }}
        />
      )}
      <Rnd
        bounds="parent"
        className={animating ? "window-animating" : undefined}
        size={{ width: shown.w, height: shown.h }}
        position={{ x: shown.x, y: shown.y }}
        onDragStart={() => focusApp(app.id)}
        onDrag={(e) => {
          const x = pointerX(e as MouseEvent | TouchEvent);
          setSnap(x <= SNAP_EDGE ? "left" : x >= area.w - SNAP_EDGE ? "right" : null);
        }}
        onDragStop={(_e, d) => {
          if (snap) {
            animateLayout();
            setRect({ x: snap === "left" ? 0 : area.w / 2, y: 0, w: area.w / 2, h: area.h });
            setSnap(null);
          } else setRect((r) => ({ ...r, x: d.x, y: d.y }));
        }}
        onResizeStart={() => focusApp(app.id)}
        onResizeStop={(_e, _dir, ref, _delta, pos) =>
          setRect({ w: ref.offsetWidth, h: ref.offsetHeight, x: pos.x, y: pos.y })
        }
        minWidth={Math.min(app.minWidth ?? 340, area.w - GAP * 2)}
        minHeight={Math.min(app.minHeight ?? 260, area.h - GAP)}
        dragHandleClassName="titlebar"
        cancel=".no-drag"
        disableDragging={win.max}
        enableResizing={!win.max && !win.min}
        style={{
          zIndex: win.z,
          pointerEvents: win.min ? "none" : "auto",
          visibility: hidden ? "hidden" : "visible"
        }}
      >
        <motion.section
          ref={sectionRef}
          id={`window-${app.id}`}
          tabIndex={-1}
          role="dialog"
          aria-labelledby={`window-title-${app.id}`}
          className={`window material-sidebar ${focused ? "is-focused" : ""} ${win.max ? "is-max" : ""}`}
          onPointerDownCapture={() => focusApp(app.id)}
          onFocusCapture={() => focusApp(app.id)}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.2, x: openFrom.x, y: openFrom.y }}
          animate={
            win.min
              ? reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.15, x: minTarget.x, y: minTarget.y }
              : { opacity: 1, scale: 1, x: 0, y: 0 }
          }
          exit={
            reduced
              ? { opacity: 0, transition: { duration: duration.micro } }
              : { opacity: 0, scale: 0.95, transition: { duration: duration.micro, ease: ease.standard } }
          }
          transition={
            reduced
              ? { duration: duration.standard, ease: ease.standard }
              : win.min
                ? { duration: duration.emphasis, ease: ease.in }
                : spring.window
          }
          onAnimationComplete={() => {
            if (useStore.getState().windows[app.id]?.min) setHidden(true);
          }}
        >
          <header className="titlebar" onDoubleClick={() => toggleMaxApp(app.id)}>
            <TrafficLights
              title={app.title}
              max={win.max}
              onClose={() => closeApp(app.id)}
              onMin={() => minimizeApp(app.id)}
              onMax={() => toggleMaxApp(app.id)}
            />
            <h2 id={`window-title-${app.id}`} className="titlebar-title">
              {app.title}
            </h2>
          </header>
          <div className="window-body">
            <WindowContext.Provider
              value={{ id: app.id, width: shown.w, payload: win.payload, nonce: win.nonce, mobile: false }}
            >
              <Suspense fallback={<AppSkeleton />}>
                <Content />
              </Suspense>
            </WindowContext.Provider>
          </div>
        </motion.section>
      </Rnd>
    </>
  );
}
