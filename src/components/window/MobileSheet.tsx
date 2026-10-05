import { Suspense } from "react";
import { motion, useDragControls } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import { WindowContext } from "./WindowContext";
import { spring } from "~/styles/motion";

// Full-screen iOS-style sheet. Drag the top bar down (or tap Done / press Esc) to close.
export default function MobileSheet({ app }: { app: AppDef }) {
  const win = useStore((s) => s.windows[app.id])!;
  const closeApp = useStore((s) => s.closeApp);
  const reduced = useReducedMotion();
  const { winWidth } = useWindowSize();
  const drag = useDragControls();
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    doneRef.current?.focus({ preventScroll: true });
  }, [win.nonce]);

  const Content = app.component;

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby={`sheet-title-${app.id}`}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-panel shadow-overlay"
      style={{ paddingTop: "env(safe-area-inset-top)", zIndex: 50 + win.z }}
      initial={reduced ? { opacity: 0 } : { y: "100%" }}
      animate={reduced ? { opacity: 1 } : { y: 0 }}
      exit={reduced ? { opacity: 0 } : { y: "100%" }}
      transition={spring.sheet}
      drag={reduced ? false : "y"}
      dragControls={drag}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.9 }}
      onDragEnd={(_e, info) => {
        if (info.offset.y > 110 || info.velocity.y > 600) closeApp(app.id);
      }}
    >
      <header
        className="flex-none touch-none select-none border-b border-hairline bg-panel-2"
        onPointerDown={(e) => drag.start(e)}
      >
        <div className="mx-auto mt-1.5 h-1.5 w-10 rounded-full" style={{ background: "var(--text-3)", opacity: 0.35 }} aria-hidden="true" />
        <div className="flex h-12 items-center justify-between px-2">
          <span className="w-[72px]" aria-hidden="true" />
          <h2 id={`sheet-title-${app.id}`} className="hstack gap-2 text-callout font-semibold">
            <AppIcon icon={app.icon} size={22} />
            {app.title}
          </h2>
          <button
            ref={doneRef}
            type="button"
            className="h-11 w-[72px] rounded-button text-callout font-semibold text-accent-text active:scale-[.96]"
            onClick={() => closeApp(app.id)}
          >
            Done
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <WindowContext.Provider
          value={{ id: app.id, width: winWidth, payload: win.payload, nonce: win.nonce, mobile: true }}
        >
          <Suspense fallback={<AppSkeleton />}>
            <Content />
          </Suspense>
        </WindowContext.Provider>
      </div>
    </motion.section>
  );
}
