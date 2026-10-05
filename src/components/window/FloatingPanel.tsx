import { Suspense } from "react";
import { motion } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import { DOCK_RESERVE, MENU_BAR_HEIGHT } from "~/utils";
import { WindowContext } from "./WindowContext";
import { fadeFast, spring } from "~/styles/motion";

// Siri-style panel pinned under the menu bar (used by "Ask Raj's AI").
export default function FloatingPanel({ app }: { app: AppDef }) {
  const win = useStore((s) => s.windows[app.id])!;
  const focused = useStore((s) => s.focusedId === app.id);
  const closeApp = useStore((s) => s.closeApp);
  const minimizeApp = useStore((s) => s.minimizeApp);
  const focusApp = useStore((s) => s.focusApp);
  const reduced = useReducedMotion();
  const { winWidth, winHeight } = useWindowSize();
  const ref = useRef<HTMLElement>(null);

  const width = Math.min(app.width, winWidth - 24);
  const height = Math.min(app.height, winHeight - MENU_BAR_HEIGHT - DOCK_RESERVE - 8);

  useEffect(() => {
    if (!win.min) ref.current?.querySelector<HTMLElement>("textarea")?.focus({ preventScroll: true });
  }, [win.nonce]);

  const Content = app.component;
  const hidden = win.min;

  return (
    <motion.section
      ref={ref}
      id={`window-${app.id}`}
      role="dialog"
      aria-labelledby={`window-title-${app.id}`}
      className={`window material-sidebar fixed right-3 ${focused ? "is-focused" : ""}`}
      style={{
        top: MENU_BAR_HEIGHT + 8,
        width,
        height,
        zIndex: 25,
        transformOrigin: "top right",
        pointerEvents: hidden ? "none" : "auto"
      }}
      onPointerDownCapture={() => focusApp(app.id)}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: -24 }}
      animate={hidden ? { opacity: 0, scale: reduced ? 1 : 0.6, y: reduced ? 0 : -24 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: -16, transition: fadeFast }}
      transition={spring.panel}
    >
      <header className="titlebar" style={{ cursor: "default" }}>
        <div className="traffic">
          <button type="button" aria-label={`Close ${app.title}`} title="Close (Esc)" onClick={() => closeApp(app.id)}>
            <span className="light is-close">
              <span className="i-ph:x-bold" />
            </span>
          </button>
          <button type="button" aria-label={`Minimize ${app.title}`} title="Minimize" onClick={() => minimizeApp(app.id)}>
            <span className="light is-min">
              <span className="i-ph:minus-bold" />
            </span>
          </button>
        </div>
        <h2 id={`window-title-${app.id}`} className="titlebar-title">
          <span className="assistant-orb !size-4" aria-hidden="true" />
          {app.title}
        </h2>
      </header>
      <div className="window-body">
        <WindowContext.Provider value={{ id: app.id, width, payload: win.payload, nonce: win.nonce, mobile: false }}>
          <Suspense fallback={<AppSkeleton />}>
            <Content />
          </Suspense>
        </WindowContext.Provider>
      </div>
    </motion.section>
  );
}
