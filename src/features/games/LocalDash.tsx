import type React from "react";
import { isCoarsePointer } from "~/shells/device";
import { feedback } from "~/sensory/feedback";
import { Overlay, Stats, ToolButton, useTokenColors } from "./ui";
import { keyDir, useOnHidden, useSwipe } from "./input";
import {
  createDash,
  DASH_TOKENS,
  type Dash,
  type DashAction,
  type DashHud
} from "./dash/engine";
import type { GameProps } from "./types";

type Status = "ready" | "playing" | "paused" | "over";

const ACTION: Record<string, DashAction> = {
  left: "left",
  right: "right",
  up: "jump",
  down: "slide"
};

/** Mumbai Local Dash: a 3D endless runner through Dadar, Marine Drive and the Sea Link. */
export default function LocalDash({ size, onFinish, best }: GameProps) {
  const touch = useMemo(isCoarsePointer, []);
  const reduced = useReducedMotion();
  const colors = useTokenColors(DASH_TOKENS);
  const boardRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dash = useRef<Dash | null>(null);
  const [status, setStatus] = useState<Status>("ready");
  const statusRef = useRef(status);
  statusRef.current = status;
  const [hud, setHud] = useState<DashHud>({
    distance: 0,
    coins: 0,
    chai: 0,
    fast: 0,
    shield: false,
    stage: "Dadar"
  });
  const [result, setResult] = useState<{
    distance: number;
    coins: number;
    score: number;
    newBest: boolean;
  } | null>(null);

  // Portrait-ish on phones, landscape on wider screens; never more than the square we're given.
  const w = Math.max(240, Math.floor(size));
  const h = touch ? w : Math.round(w * 0.72);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const [noGl, setNoGl] = useState(false);

  useEffect(() => {
    // A fresh canvas per engine: a disposed renderer loses its context for good.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    viewRef.current!.appendChild(canvas);
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
          const el = boardRef.current ?? undefined;
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
      // No WebGL (old device, or disabled): say so instead of breaking the Arcade.
      setNoGl(true);
      return () => canvas.remove();
    }
    dash.current = d;
    return () => {
      d.dispose();
      canvas.remove();
      dash.current = null;
    };
  }, []);

  useEffect(() => dash.current?.resize(w, h), [w, h]);

  const start = () => {
    setResult(null);
    dash.current?.start();
    setStatus("playing");
    boardRef.current?.focus();
  };
  const pause = () => {
    dash.current?.setRunning(false);
    setStatus("paused");
  };
  const resume = () => {
    dash.current?.setRunning(true);
    setStatus("playing");
    boardRef.current?.focus();
  };
  const togglePause = () =>
    statusRef.current === "playing"
      ? pause()
      : statusRef.current === "paused" && resume();

  useOnHidden(() => statusRef.current === "playing" && pause());
  useSwipe(
    boardRef,
    (d) => statusRef.current === "playing" && dash.current?.act(ACTION[d])
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = statusRef.current;
    if (e.key === " " || e.key === "Enter" || e.key.toLowerCase() === "p") {
      e.preventDefault();
      if (s === "ready" || s === "over") start();
      else togglePause();
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
    <div className="game-stage">
      <Stats
        items={[
          { label: "Distance", value: `${hud.distance} m` },
          { label: "Vada pav", value: hud.coins },
          { label: "Best", value: best ?? "—" }
        ]}
      >
        {(status === "playing" || status === "paused") && (
          <ToolButton
            label={status === "paused" ? "Resume" : "Pause"}
            icon={status === "paused" ? "i-ph:play-fill" : "i-ph:pause-fill"}
            onClick={togglePause}
          />
        )}
      </Stats>

      <div
        ref={boardRef}
        className="game-board dash-board glass glass-flat"
        style={{ width: w + 16, height: h + 16 }}
        tabIndex={0}
        role="application"
        aria-label="Mumbai Local Dash. Left and right switch lanes, up jumps, down slides, space pauses."
        onKeyDown={onKeyDown}
        onBlur={() => statusRef.current === "playing" && !touch && pause()}
      >
        <div ref={viewRef} className="dash-view" style={{ width: w, height: h }} />
        {status !== "ready" && (
          <div className="dash-hud" aria-hidden="true">
            <span className="dash-chip glass glass-flat">{hud.stage}</span>
            {power.map((p) => (
              <span key={p} className="dash-chip glass glass-flat">
                {p}
              </span>
            ))}
          </div>
        )}
        {hud.fast > 0 && status === "playing" && (
          <div className={`dash-speed ${reduced ? "is-still" : ""}`} aria-hidden="true" />
        )}
        {noGl && (
          <Overlay
            title="3D isn't available"
            body="This game needs WebGL, which this browser has turned off. The other Arcade games work fine."
          />
        )}
        {status === "ready" && !noGl && (
          <Overlay
            title="Mumbai Local Dash"
            body={
              <>
                Dodge rickshaws, handcarts and the oncoming local. Collect vada pav.
                <br />
                {touch
                  ? "Swipe to switch lanes, jump and slide."
                  : "Arrow keys or WASD. Space or Enter to start."}
              </>
            }
            action="Start running"
            onAction={start}
          />
        )}
        {status === "paused" && (
          <Overlay
            title="Paused"
            body="Press space or tap Resume."
            action="Resume"
            onAction={resume}
          />
        )}
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
    </div>
  );
}
