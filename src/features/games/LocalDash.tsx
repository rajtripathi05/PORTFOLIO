import type React from "react";
import { createPortal } from "react-dom";
import { isCoarsePointer } from "~/shells/device";
import { useAppBack } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import { Overlay, useTokenColors } from "./ui";
import { keyDir, useOnHidden, useSwipe } from "./input";
import { createDash, DASH_TOKENS, type Dash, type DashAction, type DashHud } from "./dash/engine";
import type { GameProps } from "./types";

type Status = "ready" | "countdown" | "playing" | "paused" | "over";

const ACTION: Record<string, DashAction> = { left: "left", right: "right", up: "jump", down: "slide" };

/** Mumbai Local Dash: a launcher card in the Arcade; the run itself plays fullscreen. */
export default function LocalDash({ onFinish, best }: GameProps) {
  const [open, setOpen] = useState(false);
  const playRef = useRef<HTMLButtonElement>(null);
  const touch = useMemo(isCoarsePointer, []);

  return (
    <div className="game-stage">
      <div className="dash-launch tile-game-local">
        <span className="i-ph:train-bold dash-launch-glyph" aria-hidden="true" />
        <p className="dash-launch-title">Mumbai Local Dash</p>
        <p className="dash-launch-sub">Dadar · Marine Drive · Sea Link</p>
        <button
          ref={playRef}
          type="button"
          className="btn-primary dash-launch-play"
          onClick={() => {
            feedback("open");
            setOpen(true);
          }}
        >
          <span className="i-ph:play-fill" aria-hidden="true" />
          Play fullscreen
        </button>
        <p className="dash-launch-best tabular-nums">{best === undefined ? "Not played yet" : `Best ${best}`}</p>
      </div>
      <p className="game-hint">
        {touch ? "Swipe to switch lanes, jump and slide." : "Arrow keys or WASD · Space pauses · Esc leaves."}
      </p>
      {open &&
        createPortal(
          <Runner
            best={best}
            onFinish={onFinish}
            onClose={() => {
              setOpen(false);
              // Back to where the visitor was: the Play button of this card.
              requestAnimationFrame(() => playRef.current?.focus());
            }}
          />,
          document.body
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ runner */

const fullscreenEl = () => document.fullscreenElement ?? null;

function Runner({ best, onFinish, onClose }: { best?: number; onFinish: GameProps["onFinish"]; onClose: () => void }) {
  const touch = useMemo(isCoarsePointer, []);
  const reduced = useReducedMotion();
  const colors = useTokenColors(DASH_TOKENS);
  const layerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dash = useRef<Dash | null>(null);
  const [status, setStatus] = useState<Status>("ready");
  const statusRef = useRef(status);
  statusRef.current = status;
  const [count, setCount] = useState(0);
  const [noGl, setNoGl] = useState(false);
  const [hud, setHud] = useState<DashHud>({ distance: 0, coins: 0, chai: 0, fast: 0, shield: false, stage: "Dadar" });
  const [result, setResult] = useState<{ distance: number; coins: number; score: number; newBest: boolean } | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  /* --- the immersive layer: shell inert, Fullscreen API where there is one --- */
  useEffect(() => {
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    document.documentElement.classList.add("dash-immersive");
    const layer = layerRef.current!;
    // Called inside the click that opened us; iPhone Safari has no page Fullscreen API,
    // and the fixed layer is the fullscreen there. Never wait on it.
    layer.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
    layer.focus();
    return () => {
      root?.removeAttribute("inert");
      document.documentElement.classList.remove("dash-immersive");
      if (fullscreenEl()) document.exitFullscreen().catch(() => {});
    };
  }, []);

  /* --- engine: one renderer per open layer, disposed with it --- */
  const sizeOf = () => {
    const r = layerRef.current!.getBoundingClientRect();
    return { w: Math.max(200, Math.round(r.width)), h: Math.max(200, Math.round(r.height)) };
  };
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    viewRef.current!.appendChild(canvas);
    const { w, h } = sizeOf();
    let d: Dash;
    try {
      d = createDash({
        canvas,
        width: w,
        height: h,
        colors,
        reduced,
        mobile: touch,
        startAt: import.meta.env.DEV ? Number(new URLSearchParams(location.search).get("dashFrom")) || 0 : 0,
        onHud: setHud,
        onCue: (c) => {
          const el = layerRef.current ?? undefined;
          if (c === "coin") feedback("tap");
          else if (c === "power") feedback("success", { el });
          else if (c === "horn") feedback("notify", { el });
          else feedback("error", { el });
        },
        onOver: ({ distance, coins }) => {
          const score = distance + coins * 10;
          const newBest = onFinishRef.current(score);
          setResult({ distance, coins, score, newBest });
          setStatus("over");
          if (newBest) feedback("success");
        }
      });
    } catch {
      setNoGl(true);
      return () => canvas.remove();
    }
    dash.current = d;
    const ro = new ResizeObserver(() => {
      const s = sizeOf();
      d.resize(s.w, s.h);
      // A rotation or window resize mid-run pauses it.
      if (statusRef.current === "playing" || statusRef.current === "countdown") pause();
    });
    ro.observe(layerRef.current!);
    return () => {
      ro.disconnect();
      d.dispose();
      canvas.remove();
      dash.current = null;
    };
  }, []);

  /* --- run control --- */
  const countdown = useRef(0);
  const runCountdown = (then: () => void) => {
    clearInterval(countdown.current);
    setStatus("countdown");
    setCount(3);
    let n = 3;
    countdown.current = window.setInterval(() => {
      n -= 1;
      if (n > 0) setCount(n);
      else {
        clearInterval(countdown.current);
        then();
      }
    }, 600);
  };
  useEffect(() => () => clearInterval(countdown.current), []);

  const start = () => {
    setResult(null);
    dash.current?.start();
    dash.current?.setRunning(false);
    runCountdown(() => {
      dash.current?.setRunning(true);
      setStatus("playing");
    });
    layerRef.current?.focus();
  };
  const pause = () => {
    clearInterval(countdown.current);
    dash.current?.setRunning(false);
    setStatus("paused");
  };
  const resume = () => {
    runCountdown(() => {
      dash.current?.setRunning(true);
      setStatus("playing");
    });
    layerRef.current?.focus();
  };
  const exit = () => {
    clearInterval(countdown.current);
    dash.current?.setRunning(false);
    onClose();
  };

  const active = () => statusRef.current === "playing" || statusRef.current === "countdown";
  useOnHidden(() => active() && pause());
  useEffect(() => {
    const onBlur = () => active() && pause();
    const onFs = () => !fullscreenEl() && active() && pause();
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  // Esc (once the browser has left fullscreen) and the touch Back button leave the game.
  useEscape(exit);
  useAppBack(true, "Mumbai Local Dash", exit);

  useSwipe(layerRef, (d) => statusRef.current === "playing" && dash.current?.act(ACTION[d]));

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Keep Escape away from the Arcade's own handler (it would leave the whole game view).
    if (e.key === "Escape") {
      e.stopPropagation();
      return;
    }
    const s = statusRef.current;
    if (e.key === " " || e.key === "Enter" || e.key.toLowerCase() === "p") {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      if (s === "ready" || s === "over") start();
      else if (s === "playing") pause();
      else if (s === "paused") resume();
      return;
    }
    const d = keyDir(e);
    if (d && s === "playing") {
      e.preventDefault();
      dash.current?.act(ACTION[d]);
    }
  };

  const power = [
    hud.chai > 0 && `Chai 2× · ${Math.ceil(hud.chai)}s`,
    hud.shield && "Umbrella",
    hud.fast > 0 && `Fast Local · ${Math.ceil(hud.fast)}s`
  ].filter(Boolean) as string[];

  return (
    <div
      ref={layerRef}
      className="dash-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Mumbai Local Dash. Left and right switch lanes, up jumps, down slides, space pauses, Escape leaves."
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div ref={viewRef} className="dash-view" />
      <div className="dash-vignette" aria-hidden="true" />
      {hud.fast > 0 && status === "playing" && (
        <div className={`dash-speed ${reduced ? "is-still" : ""}`} aria-hidden="true" />
      )}

      <div className="dash-top">
        {(status === "playing" || status === "countdown") && (
          <button type="button" className="dash-btn glass glass-press" aria-label="Pause" onClick={pause}>
            <span className="i-ph:pause-fill" aria-hidden="true" />
          </button>
        )}
        {status !== "ready" && (
          <div className="dash-hud" aria-hidden="true">
            <span className="dash-chip glass tabular-nums">{hud.distance} m</span>
            <span className="dash-chip glass tabular-nums">{hud.coins} vada pav</span>
            {power.map((p) => (
              <span key={p} className="dash-chip glass">
                {p}
              </span>
            ))}
          </div>
        )}
        <button type="button" className="dash-btn dash-exit glass glass-press" aria-label="Exit game" onClick={exit}>
          <span className="i-ph:x-bold" aria-hidden="true" />
          <span className="dash-exit-label">Exit</span>
        </button>
      </div>

      {status === "countdown" && (
        <div className="dash-count" aria-live="assertive">
          <span key={count}>{count}</span>
        </div>
      )}
      {noGl && (
        <Overlay
          title="3D isn't available"
          body="This game needs WebGL, which this browser has turned off. The other Arcade games work fine."
          action="Exit"
          onAction={exit}
        />
      )}
      {status === "ready" && !noGl && (
        <Overlay
          title="Mumbai Local Dash"
          body={touch ? "Swipe to switch lanes, jump and slide." : "Arrow keys or WASD. Space to start and pause."}
          action="Tap to run"
          onAction={start}
        />
      )}
      {status === "paused" && <Overlay title="Paused" action="Resume" onAction={resume} />}
      {status === "over" && result && (
        <Overlay
          title="Missed your local!"
          badge={result.newBest ? "New best!" : undefined}
          body={
            <span className="tabular-nums">
              {result.distance} m · {result.coins} vada pav · score {result.score}
              <br />
              Best {Math.max(best ?? 0, result.score)}
            </span>
          }
          action="Run again"
          onAction={start}
        />
      )}
    </div>
  );
}
