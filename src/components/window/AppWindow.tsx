import { Suspense } from "react";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import { DOCK_RESERVE, MENU_BAR_HEIGHT } from "~/utils";
import { WindowContext } from "./WindowContext";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GAP = 12;

const useArea = () => {
  const { winWidth, winHeight } = useWindowSize();
  return { w: winWidth, h: Math.max(240, winHeight - MENU_BAR_HEIGHT - DOCK_RESERVE) };
};

// Keep the whole window inside the visible area.
const clampRect = (r: Rect, area: { w: number; h: number }): Rect => {
  const w = Math.min(r.w, area.w - GAP * 2);
  const h = Math.min(r.h, area.h - GAP);
  return {
    w,
    h,
    x: Math.min(Math.max(GAP, r.x), area.w - w - GAP),
    y: Math.min(Math.max(4, r.y), area.h - h - 4)
  };
};

// Centred, sized to fit, with a small cascade so stacked windows stay visible.
const initialRect = (app: AppDef, area: { w: number; h: number }, order: number): Rect => {
  const w = Math.min(app.width, area.w - GAP * 2);
  const h = Math.min(app.height, area.h - GAP);
  const offset = ((order % 5) - 2) * 24;
  return clampRect(
    { w, h, x: (area.w - w) / 2 + offset, y: (area.h - h) / 2 + offset * 0.6 },
    area
  );
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
    <button type="button" aria-label={`Minimize ${title}`} title="Minimize" onClick={onMin}>
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
  const [rect, setRect] = useState<Rect>(() => initialRect(app, area, win.order));
  const [hidden, setHidden] = useState(false);

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
    const dock = document.getElementById(`dock-${app.id}`)?.getBoundingClientRect();
    const self = sectionRef.current.getBoundingClientRect();
    if (dock && self.width > 0) {
      minTarget = {
        x: dock.left + dock.width / 2 - (self.left + self.width / 2),
        y: dock.top + dock.height / 2 - (self.top + self.height / 2)
      };
    }
  }

  const Content = app.component;

  return (
    <Rnd
      bounds="parent"
      size={{ width: shown.w, height: shown.h }}
      position={{ x: shown.x, y: shown.y }}
      onDragStart={() => focusApp(app.id)}
      onDragStop={(_e, d) => setRect((r) => ({ ...r, x: d.x, y: d.y }))}
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
        className={`window glass-window ${focused ? "is-focused" : ""} ${
          win.max ? "is-max" : ""
        }`}
        onPointerDownCapture={() => focusApp(app.id)}
        onFocusCapture={() => focusApp(app.id)}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
        animate={
          win.min
            ? reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.15, x: minTarget.x, y: minTarget.y }
            : { opacity: 1, scale: 1, x: 0, y: 0 }
        }
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, transition: { duration: 0.16 } }}
        transition={
          win.min
            ? { duration: reduced ? 0.01 : 0.32, ease: [0.4, 0, 0.6, 1] }
            : { type: "spring", stiffness: 420, damping: 32, mass: 0.8 }
        }
        onAnimationComplete={() => {
          if (useStore.getState().windows[app.id]?.min) setHidden(true);
        }}
      >
        <header
          className="titlebar glass-titlebar"
          onDoubleClick={() => toggleMaxApp(app.id)}
        >
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
            value={{
              id: app.id,
              width: shown.w,
              payload: win.payload,
              nonce: win.nonce,
              mobile: false
            }}
          >
            <Suspense fallback={<AppSkeleton />}>
              <Content />
            </Suspense>
          </WindowContext.Provider>
        </div>
      </motion.section>
    </Rnd>
  );
}
