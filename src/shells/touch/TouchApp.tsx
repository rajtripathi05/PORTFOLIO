import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import type { ShellKind } from "~/types";
import AppIcon from "~/components/AppIcon";
import { feedback } from "~/sensory/feedback";
import { spring } from "~/styles/motion";
import { AppHostContext } from "../host";
import { getOrigin, goBack, pushBackFor, useTopStep } from "./nav";

interface TouchAppProps {
  app: AppDef;
  shell: Exclude<ShellKind, "desktop">;
  /** Only the top app is reachable; the ones beneath are inert. */
  top: boolean;
}

/**
 * One app, hosted full-bleed (phone) or as a page card (tablet). Provides the AppHost
 * contract: params, content width, close() and in-app back steps. The nav bar's back
 * button is "‹ {label}" for an in-app step, otherwise "‹ Home".
 */
export default function TouchApp({ app, shell, top }: TouchAppProps) {
  const win = useStore((s) => s.windows[app.id])!;
  const step = useTopStep(app.id);
  const reduced = useReducedMotion();
  const bodyRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState(shell === "phone" ? window.innerWidth : app.width);
  const origin = useRef(getOrigin(app.id));
  useReturnFocus(sectionRef, `[data-tour-id="${app.id}"]`);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, [win.nonce]);

  useEffect(() => {
    const el = sectionRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = !top;
  }, [top]);

  const Content = app.component;
  const o = origin.current;
  const zoom = !reduced && o && shell === "phone";
  const label = step?.label ?? "Home";

  return (
    <motion.section
      ref={sectionRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`touch-title-${app.id}`}
      className={`touch-app touch-app-${shell}${app.floating ? " touch-app-panel" : ""}`}
      style={{ zIndex: 50 + win.z, transformOrigin: zoom ? `${o.x}px ${o.y}px` : undefined }}
      initial={reduced ? { opacity: 0 } : zoom ? { opacity: 0, scale: 0.12 } : { opacity: 0, y: 28 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : zoom ? { opacity: 0, scale: 0.12 } : { opacity: 0, y: 28 }}
      transition={spring.sheet}
    >
      <header className="touch-nav">
        <button
          ref={backRef}
          type="button"
          className="touch-nav-back press"
          onClick={() => goBack(app.id)}
          aria-label={step ? `Back to ${label}` : "Back to Home"}
        >
          <span className="i-ph:caret-left-bold" aria-hidden="true" />
          {label}
        </button>
        <h2 id={`touch-title-${app.id}`} className="touch-nav-title">
          <AppIcon icon={app.icon} size={22} />
          {step ? step.label : app.title}
        </h2>
        <button
          type="button"
          className="touch-nav-done press"
          onClick={() => {
            feedback("close");
            useStore.getState().closeApp(app.id);
          }}
        >
          Done
        </button>
      </header>
      <div ref={bodyRef} className="touch-body">
        <AppHostContext.Provider
          value={{
            id: app.id,
            shell,
            width,
            params: win.params,
            nonce: win.nonce,
            close: () => useStore.getState().closeApp(app.id),
            pushBack: pushBackFor(app.id)
          }}
        >
          <Suspense fallback={<AppSkeleton />}>
            <Content />
          </Suspense>
        </AppHostContext.Provider>
      </div>
    </motion.section>
  );
}
