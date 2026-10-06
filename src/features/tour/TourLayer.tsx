import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { AppId } from "~/types";
import { openApp } from "~/stores";
import { feedback } from "~/sensory/feedback";
import { stopTour, useTour } from "./index";

/** The four stops of the 30-second tour. */
const STEPS: { app: AppId; title: string; text: string }[] = [
  { app: "projects", title: "Projects", text: "Open any project to read what it does and visit its live site." },
  { app: "achievements", title: "Achievements", text: "Hackathon wins and awards, with photos and videos." },
  { app: "assistant", title: "Ask my AI", text: "Ask anything about Raj's work — answers come from this portfolio." },
  { app: "resume", title: "Resume", text: "View the resume or download it as a PDF." }
];

const AUTO_ADVANCE_MS = 7000;
const GAP = 12;
const EDGE = 12;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The launcher for `app` (dock icon, home-screen icon, menu item…) if it's on screen and not covered. */
const visibleLauncher = (app: AppId): DOMRect | null => {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${app}"]`));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) continue;
    const x = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
    const hit = document.elementFromPoint(x, y);
    if (hit && (el === hit || el.contains(hit) || hit.contains(el))) return r;
  }
  return null;
};

/** Rendered by every shell; shows the tour while it is active. */
export default function TourLayer() {
  const active = useTour((s) => s.active);
  const [step, setStep] = useState(0);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [paused, setPaused] = useState(false);
  const [cardSize, setCardSize] = useState({ w: 320, h: 150 });
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const index = Math.min(step, STEPS.length - 1);
  const current = STEPS[index];
  const last = index === STEPS.length - 1;

  const finish = (completed: boolean) => {
    feedback(completed ? "success" : "close", { el: cardRef.current });
    stopTour();
  };
  const next = () => {
    if (last) return finish(true);
    feedback("tap", { el: nextRef.current });
    setStep((s) => s + 1);
  };

  // Start from the first stop every time the tour is started.
  useEffect(() => {
    if (!active) return;
    setStep(0);
    setPaused(false);
    requestAnimationFrame(() => nextRef.current?.focus({ preventScroll: true }));
  }, [active]);

  // Each stop opens its app, then looks for the app's launcher once the app has settled.
  useEffect(() => {
    if (!active) return;
    openApp(current.app);
    const locate = () => setAnchor(visibleLauncher(current.app));
    locate();
    const t1 = setTimeout(locate, 120);
    const t2 = setTimeout(locate, 450);
    window.addEventListener("resize", locate);
    window.addEventListener("orientationchange", locate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", locate);
      window.removeEventListener("orientationchange", locate);
    };
  }, [active, current.app]);

  // Auto-advance after ~7s (paused while the pointer rests on the card).
  useEffect(() => {
    if (!active || paused) return;
    const t = setTimeout(() => {
      if (index === STEPS.length - 1) {
        feedback("success", { el: cardRef.current });
        stopTour();
      } else setStep(index + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [active, paused, index]);

  // Escape skips the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      feedback("close", { el: cardRef.current });
      stopTour();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (el && (el.offsetWidth !== cardSize.w || el.offsetHeight !== cardSize.h))
      setCardSize({ w: el.offsetWidth, h: el.offsetHeight });
  });

  if (!active) return null;

  const shell = document.documentElement.dataset.shell || "desktop";
  const reduced = prefersReducedMotion();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(320, vw - EDGE * 2);
  const move = reduced
    ? "none"
    : "left var(--duration-emphasis, 240ms) var(--ease-standard, ease), top var(--duration-emphasis, 240ms) var(--ease-standard, ease)";

  let position: CSSProperties;
  if (anchor) {
    const left = Math.min(Math.max(anchor.left + anchor.width / 2 - cardSize.w / 2, EDGE), vw - cardSize.w - EDGE);
    const below = anchor.top + anchor.height / 2 < vh / 2;
    position = below
      ? { left, top: Math.min(anchor.bottom + GAP, vh - cardSize.h - EDGE) }
      : { left, top: Math.max(anchor.top - GAP - cardSize.h, EDGE) };
  } else {
    // No visible launcher: centered at the bottom, clear of the dock / tab bar / home indicator.
    const lift = shell === "phone" ? 88 : shell === "tablet" ? 96 : 104;
    position = {
      left: "50%",
      bottom: `calc(env(safe-area-inset-bottom, 0px) + ${lift}px)`,
      transform: "translateX(-50%)"
    };
  }

  return (
    <>
      {anchor && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-button"
          style={{
            zIndex: 9998,
            left: anchor.left - 4,
            top: anchor.top - 4,
            width: anchor.width + 8,
            height: anchor.height + 8,
            boxShadow: "0 0 0 2px var(--accent), 0 0 0 6px var(--accent-subtle)",
            transition: reduced ? "none" : "all var(--duration-emphasis, 240ms) var(--ease-standard, ease)"
          }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-live="polite"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className="material-popover fixed rounded-panel border border-hairline p-4 text-ink-1 shadow-overlay"
        style={{ ...position, zIndex: 9999, width, transition: move }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <p className="text-footnote font-semibold text-ink-3">
          Quick tour · {index + 1} of {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-body font-bold">
          {current.title}
        </h2>
        <p id="tour-text" className="mt-1 text-footnote leading-snug text-ink-2">
          {current.text}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.app} className={`block size-1.5 rounded-full ${i === index ? "bg-accent" : "bg-panel-3"}`} />
            ))}
          </span>
          <button type="button" className="btn-secondary btn-sm ml-auto" onClick={() => finish(false)}>
            Skip
          </button>
          <button ref={nextRef} type="button" className="btn-primary btn-sm" onClick={next}>
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
