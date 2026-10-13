import type React from "react";
import { createPortal } from "react-dom";
import { isCoarsePointer } from "~/shells/device";
import { useAppBack } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import { useSensory } from "~/sensory/settings";
import { storage } from "~/utils/storage";
import { useTokenColors } from "./ui";
import { keyDir, useOnHidden, useSwipe } from "./input";
import {
  CHAI_S,
  createDash,
  DASH_TOKENS,
  FAST_S,
  type Dash,
  type DashAction,
  type DashEvent,
  type DashHud,
  type Tier,
  type TierPref
} from "./dash/engine";
import type { GameProps } from "./types";

type Status = "ready" | "tutorial" | "countdown" | "playing" | "paused" | "over";

const ACTION: Record<string, DashAction> = { left: "left", right: "right", up: "jump", down: "slide" };
const GFX_KEY = "dash-gfx";
const TUTORIAL_KEY = "dash-tutorial";
const PREFS: TierPref[] = ["auto", "high", "medium", "low"];
const LABEL: Record<TierPref, string> = { auto: "Auto", high: "High", medium: "Medium", low: "Low" };

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
const savedPref = (): TierPref => {
  const v = storage.get(GFX_KEY) as TierPref | null;
  return v && PREFS.includes(v) ? v : "auto";
};

function Runner({ best, onFinish, onClose }: { best?: number; onFinish: GameProps["onFinish"]; onClose: () => void }) {
  const touch = useMemo(isCoarsePointer, []);
  const reduced = !!useReducedMotion();
  const colors = useTokenColors(DASH_TOKENS);
  const muted = useSensory((s) => s.muted);
  const layerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dash = useRef<Dash | null>(null);
  const [status, setStatus] = useState<Status>("ready");
  const statusRef = useRef(status);
  statusRef.current = status;
  const [count, setCount] = useState(0);
  const [noGl, setNoGl] = useState(false);
  const [pref, setPref] = useState<TierPref>(savedPref);
  const [tier, setTier] = useState<Tier>("medium");
  const [flash, setFlash] = useState(0);
  const [pop, setPop] = useState<{ id: number; text: string } | null>(null);
  const [hud, setHud] = useState<DashHud>({ distance: 0, coins: 0, score: 0, chai: 0, fast: 0, shield: false, stage: "Dadar", train: -1 });
  const [result, setResult] = useState<{ distance: number; coins: number; score: number; newBest: boolean } | null>(null);
  const [shared, setShared] = useState<"" | "copied" | "shared">("");
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const bestRef = useRef(best ?? 0);

  /* --- the immersive layer: shell inert, Fullscreen API where there is one --- */
  useEffect(() => {
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    document.documentElement.classList.add("dash-immersive");
    const layer = layerRef.current!;
    // Called inside the click that opened us. iPhone Safari has no page Fullscreen API;
    // there the fixed layer (100dvh, safe areas) is the fullscreen. Never wait on it.
    layer.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
    layer.focus();
    return () => {
      root?.removeAttribute("inert");
      document.documentElement.classList.remove("dash-immersive");
      if (fullscreenEl()) document.exitFullscreen().catch(() => {});
    };
  }, []);

  /* --- engine: one renderer per open layer, disposed with it --- */
  const showPop = (text: string) => setPop({ id: Date.now(), text });
  const onEvent = (e: DashEvent, n?: number) => {
    const el = layerRef.current ?? undefined;
    switch (e) {
      case "coin":
        return feedback("tap");
      case "lane":
        return feedback("selection");
      case "jump":
      case "slide":
        return feedback("swipe");
      case "power":
        return feedback("success", { el });
      case "near":
        showPop(n && n > 1 ? `Close call ×${n}` : "Close call!");
        return feedback("toggle");
      case "horn":
        return feedback("notify", { el });
      case "hit":
        showPop("Umbrella saved you!");
        return feedback("error", { el });
      case "crash":
        if (!reduced) setFlash(Date.now());
        return feedback("error", { el });
      case "stage":
        return showPop(["Dadar", "Marine Drive", "Sea Link"][n ?? 0]);
    }
  };
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const sizeOf = () => {
    const r = layerRef.current!.getBoundingClientRect();
    return { w: Math.max(200, Math.round(r.width)), h: Math.max(200, Math.round(r.height)) };
  };
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    viewRef.current!.appendChild(canvas);
    const { w, h } = sizeOf();
    const test = storage.get("dashTest") === "1";
    let d: Dash;
    try {
      d = createDash({
        canvas,
        width: w,
        height: h,
        colors,
        reduced,
        mobile: touch,
        tier: pref,
        startAt: import.meta.env.DEV || test ? Number(storage.get("dashFrom")) || 0 : 0,
        onHud: setHud,
        onTier: setTier,
        onEvent: (e, n) => onEventRef.current(e, n),
        onOver: ({ distance, coins, score }) => {
          const newBest = onFinishRef.current(score);
          setResult({ distance, coins, score, newBest });
          setShared("");
          setStatus("over");
          if (newBest) feedback("success");
        }
      });
    } catch {
      setNoGl(true);
      return () => canvas.remove();
    }
    dash.current = d;
    if (test) (window as unknown as { __dash?: Dash }).__dash = d;
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
      if (test) delete (window as unknown as { __dash?: Dash }).__dash;
    };
  }, []);

  /* --- run control --- */
  const countdown = useRef(0);
  const runCountdown = () => {
    clearInterval(countdown.current);
    setStatus("countdown");
    setCount(3);
    let n = 3;
    countdown.current = window.setInterval(() => {
      n -= 1;
      if (n > 0) setCount(n);
      else {
        clearInterval(countdown.current);
        dash.current?.go();
        setStatus("playing");
      }
    }, 600);
  };
  useEffect(() => () => clearInterval(countdown.current), []);

  const begin = () => {
    setResult(null);
    bestRef.current = best ?? 0;
    dash.current?.start();
    runCountdown();
    layerRef.current?.focus();
  };
  const start = () => {
    if (!storage.get(TUTORIAL_KEY)) {
      setStatus("tutorial");
      return;
    }
    begin();
  };
  const dismissTutorial = () => {
    storage.set(TUTORIAL_KEY, "1");
    begin();
  };
  const pause = () => {
    clearInterval(countdown.current);
    dash.current?.setPaused(true);
    setStatus("paused");
  };
  const resume = () => {
    dash.current?.hold();
    runCountdown();
    layerRef.current?.focus();
  };
  const exit = () => {
    clearInterval(countdown.current);
    dash.current?.setPaused(true);
    onClose();
  };
  const choosePref = (p: TierPref) => {
    setPref(p);
    storage.set(GFX_KEY, p);
    dash.current?.setTier(p);
    // Keep a paused game still; the setting shows on resume.
    if (statusRef.current === "paused") dash.current?.setPaused(true);
  };
  const share = async () => {
    if (!result) return;
    const url = location.origin + "/";
    const text = `I ran ${result.distance} m and ate ${result.coins} vada pav in Mumbai Local Dash — score ${result.score}. Beat it:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mumbai Local Dash", text, url });
        setShared("shared");
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared("copied");
      }
      feedback("success");
    } catch {
      /* cancelled */
    }
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
    const onButton = !!(e.target as HTMLElement).closest("button");
    if (e.key === " " || e.key.toLowerCase() === "p" || (e.key === "Enter" && !onButton)) {
      if (onButton && e.key === " ") return;
      e.preventDefault();
      if (s === "ready" || s === "over") start();
      else if (s === "tutorial") dismissTutorial();
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

  useEffect(() => {
    if (!pop) return;
    const t = setTimeout(() => setPop(null), 1100);
    return () => clearTimeout(t);
  }, [pop]);

  const inRun = status === "playing" || status === "countdown" || status === "paused";
  const newBestLive = hud.score > bestRef.current && bestRef.current > 0;
  const rings = [
    hud.chai > 0 && { key: "chai", icon: "i-ph:coffee-bold", frac: hud.chai / CHAI_S, label: `Chai: double vada pav, ${Math.ceil(hud.chai)} s left` },
    hud.shield && { key: "umbrella", icon: "i-ph:umbrella-bold", frac: 1, label: "Umbrella: one free hit" },
    hud.fast > 0 && { key: "fast", icon: "i-ph:lightning-bold", frac: hud.fast / FAST_S, label: `Fast Local, ${Math.ceil(hud.fast)} s left` }
  ].filter(Boolean) as { key: string; icon: string; frac: number; label: string }[];

  const gfx = (
    <div className="dash-row" role="group" aria-label="Graphics">
      <span className="dash-row-label">Graphics</span>
      <div className="dash-seg">
        {PREFS.map((p) => (
          <button key={p} type="button" className="dash-seg-btn" aria-pressed={pref === p} onClick={() => choosePref(p)}>
            {p === "auto" && pref === "auto" ? `Auto · ${LABEL[tier]}` : LABEL[p]}
          </button>
        ))}
      </div>
    </div>
  );
  const sound = (
    <button type="button" className="dash-btn dash-sound" aria-pressed={!muted} onClick={() => useSensory.getState().toggleMute()}>
      <span className={muted ? "i-ph:speaker-slash-bold" : "i-ph:speaker-high-bold"} aria-hidden="true" />
      Sound {muted ? "off" : "on"}
    </button>
  );

  return (
    <div
      ref={layerRef}
      className={`dash-layer ${touch ? "is-touch" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Mumbai Local Dash. Left and right switch lanes, up jumps, down slides, space pauses, Escape leaves."
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div ref={viewRef} className="dash-view" />
      <div className="dash-vignette" aria-hidden="true" />
      {hud.fast > 0 && status === "playing" && <div className={`dash-speed ${reduced ? "is-still" : ""}`} aria-hidden="true" />}
      {flash > 0 && <div key={flash} className="dash-flash" aria-hidden="true" />}

      {/* Top bar: pause left, HUD, exit right */}
      <div className="dash-top">
        {(status === "playing" || status === "countdown") && (
          <button type="button" className="dash-btn" aria-label="Pause" onClick={pause}>
            <span className="i-ph:pause-fill" aria-hidden="true" />
          </button>
        )}
        <div className="dash-hud">
          {inRun && (
            <>
              <span className="dash-chip tabular-nums" aria-label={`${hud.distance} metres`}>
                {hud.distance}
                <small>m</small>
              </span>
              <span className="dash-chip tabular-nums" aria-label={`${hud.coins} vada pav`}>
                <span className="i-ph:hamburger-bold dash-vp" aria-hidden="true" />
                {hud.coins}
              </span>
              {newBestLive ? (
                <span className="dash-chip dash-chip-best">New best!</span>
              ) : (
                bestRef.current > 0 && (
                  <span className="dash-chip dash-chip-dim tabular-nums">
                    <span className="i-ph:trophy-bold" aria-hidden="true" />
                    {bestRef.current}
                  </span>
                )
              )}
            </>
          )}
        </div>
        <button type="button" className="dash-btn dash-exit" aria-label="Exit game" onClick={exit}>
          <span className="i-ph:x-bold" aria-hidden="true" />
          <span className="dash-exit-label">Exit</span>
        </button>
      </div>

      {inRun && (rings.length > 0 || hud.train >= 0) && (
        <div className="dash-rings">
          {rings.map((r) => (
            <span key={r.key} className={`dash-ring dash-ring-${r.key}`} role="img" aria-label={r.label}>
              <svg viewBox="0 0 44 44" aria-hidden="true">
                <circle className="dash-ring-track" cx="22" cy="22" r="18" />
                <circle className="dash-ring-fill" cx="22" cy="22" r="18" strokeDasharray="113.1" strokeDashoffset={113.1 * (1 - r.frac)} />
              </svg>
              <span className={r.icon} aria-hidden="true" />
            </span>
          ))}
          {hud.train >= 0 && (
            <span className="dash-chip dash-chip-warn" role="status">
              <span className="i-ph:train-bold" aria-hidden="true" />
              Train {["left", "middle", "right"][hud.train]}!
            </span>
          )}
        </div>
      )}

      <div className="dash-pop" aria-live="polite">
        {pop && (
          <span key={pop.id} className="dash-pop-text">
            {pop.text}
          </span>
        )}
      </div>

      {status === "countdown" && (
        <div className="dash-count" aria-live="assertive">
          <span key={count}>{count}</span>
        </div>
      )}

      {noGl && (
        <div className="dash-panel-wrap">
          <div className="dash-panel">
            <p className="dash-panel-title">3D isn't available</p>
            <p className="dash-panel-body">This game needs WebGL, which this browser has turned off. The other Arcade games work fine.</p>
            <button type="button" className="btn-primary dash-cta" onClick={exit} autoFocus>
              Exit
            </button>
          </div>
        </div>
      )}

      {status === "ready" && !noGl && (
        <div className="dash-start">
          <div className="dash-title">
            <h2>
              Mumbai <span>Local Dash</span>
            </h2>
            <p>Dadar · Marine Drive · Sea Link</p>
          </div>
          <div className="dash-start-actions">
            {best !== undefined && (
              <span className="dash-chip tabular-nums">
                <span className="i-ph:trophy-bold" aria-hidden="true" />
                Best {best}
              </span>
            )}
            <button type="button" className="btn-primary dash-cta dash-cta-big" onClick={start} autoFocus>
              <span className="i-ph:play-fill" aria-hidden="true" />
              {touch ? "Tap to run" : "Press Space to run"}
            </button>
            <div className="dash-settings">
              {gfx}
              {sound}
            </div>
          </div>
        </div>
      )}

      {status === "tutorial" && (
        <button type="button" className="dash-tutorial" onClick={dismissTutorial} autoFocus>
          <span className="dash-tut-grid" aria-hidden="true">
            <span className="dash-tut-arrow is-up i-ph:arrow-up-bold" />
            <span className="dash-tut-arrow is-left i-ph:arrow-left-bold" />
            <span className="dash-tut-hand i-ph:hand-swipe-left-bold" />
            <span className="dash-tut-arrow is-right i-ph:arrow-right-bold" />
            <span className="dash-tut-arrow is-down i-ph:arrow-down-bold" />
          </span>
          <span className="dash-tut-text">
            {touch ? (
              <>
                Swipe <b>left/right</b> to switch lanes, <b>up</b> to jump, <b>down</b> to slide.
              </>
            ) : (
              <>
                <b>← →</b> switch lanes, <b>↑</b> jump, <b>↓</b> slide (or WASD). <b>Space</b> pauses.
              </>
            )}
            <br />
            Grab vada pav, dodge rickshaws, carts, barriers and the local.
          </span>
          <span className="dash-tut-dismiss">{touch ? "Tap to dismiss" : "Click or press Space"}</span>
        </button>
      )}

      {status === "paused" && (
        <div className="dash-panel-wrap">
          <div className="dash-panel" role="group" aria-label="Paused">
            <p className="dash-panel-title">Paused</p>
            <button type="button" className="btn-primary dash-cta" onClick={resume} autoFocus>
              <span className="i-ph:play-fill" aria-hidden="true" />
              Resume
            </button>
            <button type="button" className="dash-btn dash-wide" onClick={begin}>
              <span className="i-ph:arrow-clockwise-bold" aria-hidden="true" />
              Restart
            </button>
            {gfx}
            {sound}
            <button type="button" className="dash-btn dash-wide" onClick={exit}>
              <span className="i-ph:sign-out-bold" aria-hidden="true" />
              Exit
            </button>
          </div>
        </div>
      )}

      {status === "over" && result && (
        <div className="dash-panel-wrap">
          <div className="dash-panel" role="group" aria-label="Game over">
            {result.newBest && <span className="dash-badge">New best!</span>}
            <p className="dash-panel-title">Missed your local!</p>
            <dl className="dash-stats tabular-nums">
              <div>
                <dt>Distance</dt>
                <dd>{result.distance} m</dd>
              </div>
              <div>
                <dt>Vada pav</dt>
                <dd>{result.coins}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{result.score}</dd>
              </div>
              <div>
                <dt>Best</dt>
                <dd>{Math.max(best ?? 0, result.score)}</dd>
              </div>
            </dl>
            <button type="button" className="btn-primary dash-cta" onClick={begin} autoFocus>
              <span className="i-ph:arrow-clockwise-bold" aria-hidden="true" />
              Run again
            </button>
            <div className="dash-pair">
              <button type="button" className="dash-btn dash-wide" onClick={share}>
                <span className={shared === "copied" ? "i-ph:check-bold" : "i-ph:share-network-bold"} aria-hidden="true" />
                {shared === "copied" ? "Copied" : "Share score"}
              </button>
              <button type="button" className="dash-btn dash-wide" onClick={exit}>
                <span className="i-ph:sign-out-bold" aria-hidden="true" />
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
