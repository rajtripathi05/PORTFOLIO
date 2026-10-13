import type React from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { motion, useDragControls, type PanInfo } from "framer-motion";
import type { AppDef } from "~/configs/apps";
import type { ShellKind } from "~/types";
import AppIcon from "~/components/AppIcon";
import { spring } from "~/styles/motion";
import { AppHostContext } from "../host";
import { closeTouchApp, getOrigin, goBack, pushBackFor, useTopStep } from "./nav";

interface TouchAppProps {
  app: AppDef;
  shell: Exclude<ShellKind, "desktop">;
  /** Only the top app is reachable; the ones beneath are inert. */
  top: boolean;
}

/** Pull the sheet down this far (or flick it) to close it. */
const DISMISS_PX = 130;
const DISMISS_VELOCITY = 700;

/**
 * One app, hosted full-bleed (phone) or as a page card (tablet). Provides the AppHost
 * contract: params, content width, close() and in-app back steps. The floating back
 * button reads "‹ {step}" for an in-app step, otherwise "‹ Home". Like iOS sheets, the
 * nav bar can be pulled down to close, and the home indicator swiped up.
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
  const drag = useDragControls();
  const homeSwipe = useRef<{ y: number; id: number } | null>(null);
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

  const close = () => {
    // A swipe-up on the home bar is followed by a click; close once. (closeApp plays the sound.)
    if (!useStore.getState().windows[app.id]?.open) return;
    closeTouchApp(app.id);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_PX || info.velocity.y > DISMISS_VELOCITY) close();
  };

  // Drags start on the bar itself, never on its buttons.
  const startDrag = (e: React.PointerEvent) => {
    if (reduced || (e.target as HTMLElement).closest("button")) return;
    drag.start(e);
  };

  const onHomeDown = (e: React.PointerEvent) => {
    homeSwipe.current = { y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHomeMove = (e: React.PointerEvent) => {
    const s = homeSwipe.current;
    if (!s || s.id !== e.pointerId || s.y - e.clientY < 40) return;
    homeSwipe.current = null;
    close();
  };

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
      drag={reduced ? false : "y"}
      dragControls={drag}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.85 }}
      dragSnapToOrigin
      onDragEnd={onDragEnd}
    >
      <header className="touch-nav" onPointerDown={startDrag}>
        <button
          ref={backRef}
          type="button"
          className="touch-nav-btn touch-nav-back glass glass-press"
          onClick={() => goBack(app.id)}
          aria-label={step ? `Back to ${label}` : "Back to Home"}
        >
          <span className="i-ph:caret-left-bold text-[18px]" aria-hidden="true" />
          <span>{label}</span>
        </button>
        <h2 id={`touch-title-${app.id}`} className="touch-nav-title">
          <AppIcon icon={app.icon} size={22} />
          <span className="truncate">{step ? step.label : app.title}</span>
        </h2>
        <button
          type="button"
          className="touch-nav-btn touch-nav-close glass glass-press"
          onClick={close}
          aria-label={`Close ${app.title}`}
          title="Close"
        >
          <span className="i-ph:x-bold text-[17px]" aria-hidden="true" />
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
            close: () => closeTouchApp(app.id),
            pushBack: pushBackFor(app.id)
          }}
        >
          <Suspense fallback={<AppSkeleton />}>
            <Content />
          </Suspense>
        </AppHostContext.Provider>
      </div>
      {shell === "phone" && (
        <div
          className="touch-home-bar"
          role="button"
          tabIndex={-1}
          aria-label="Go to Home"
          onPointerDown={onHomeDown}
          onPointerMove={onHomeMove}
          onPointerUp={() => (homeSwipe.current = null)}
          onClick={close}
        />
      )}
    </motion.section>
  );
}
