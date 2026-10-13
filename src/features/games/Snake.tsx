import type React from "react";
import { feedback } from "~/sensory/feedback";
import { isCoarsePointer } from "~/shells/device";
import type { GameProps } from "./types";
import { keyDir, useOnHidden, useSwipe, type Dir } from "./input";
import { Overlay, Stats, ToolButton, useTokenColors } from "./ui";

const N = 17;
const START_MS = 140;
const MIN_MS = 68;
const SPEED_UP = 3;

type P = { x: number; y: number };
type Status = "ready" | "playing" | "paused" | "over";

const DELTA: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const COLORS = ["game-grid", "snake-1", "snake-2", "food", "food-glow"] as const;
// Full class names, so UnoCSS can see (and generate) every icon.
const ARROW: Record<Dir, string> = {
  up: "i-ph:caret-up-bold",
  down: "i-ph:caret-down-bold",
  left: "i-ph:caret-left-bold",
  right: "i-ph:caret-right-bold"
};

const startSnake = (): P[] => [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 }
];

const randomFood = (snake: P[]): P => {
  const free: P[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
};

const fresh = () => {
  const snake = startSnake();
  return {
    snake,
    prev: snake,
    dir: "right" as Dir,
    queue: [] as Dir[],
    food: { x: 12, y: 8 } as P,
    ms: START_MS,
    acc: 0,
    eaten: null as null | { p: P; t: number },
    score: 0
  };
};

export default function Snake({ size, onFinish, best }: GameProps) {
  const cell = Math.max(12, Math.floor(Math.min(size, 540) / N));
  const px = cell * N;
  const colors = useTokenColors(COLORS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const g = useRef(fresh());
  const touch = useMemo(isCoarsePointer, []);

  const draw = (t: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = g.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);

    // Dot grid.
    ctx.fillStyle = colors["game-grid"];
    const dot = Math.max(1, cell * 0.07);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        ctx.beginPath();
        ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, dot, 0, Math.PI * 2);
        ctx.fill();
      }

    // Food: a softly pulsing orb.
    const now = performance.now();
    const fx = (s.food.x + 0.5) * cell;
    const fy = (s.food.y + 0.5) * cell;
    const r = cell * 0.34 * (1 + Math.sin(now / 170) * 0.08);
    ctx.save();
    ctx.shadowColor = colors["food-glow"];
    ctx.shadowBlur = cell * 0.8;
    const orb = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.35, r * 0.1, fx, fy, r);
    orb.addColorStop(0, "#fff");
    orb.addColorStop(0.35, colors.food);
    orb.addColorStop(1, colors.food);
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // A ring where the last piece of food was eaten.
    if (s.eaten) {
      const k = (now - s.eaten.t) / 320;
      if (k < 1) {
        ctx.strokeStyle = colors.food;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc((s.eaten.p.x + 0.5) * cell, (s.eaten.p.y + 0.5) * cell, cell * (0.4 + k * 0.9), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else s.eaten = null;
    }

    // The snake, interpolated between steps so it glides.
    const pts = s.snake.map((p, i) => {
      const q = s.prev[i] ?? p;
      return { x: (q.x + (p.x - q.x) * t + 0.5) * cell, y: (q.y + (p.y - q.y) * t + 0.5) * cell };
    });
    const head = pts[0];
    const tail = pts[pts.length - 1];
    const grad = ctx.createLinearGradient(head.x, head.y, tail.x + 0.01, tail.y + 0.01);
    grad.addColorStop(0, colors["snake-1"]);
    grad.addColorStop(1, colors["snake-2"]);
    ctx.strokeStyle = grad;
    ctx.fillStyle = colors["snake-1"];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = cell * 0.74;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(head.x, head.y, cell * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Eyes look where it's going.
    const d = DELTA[s.dir];
    const ex = -d.y * cell * 0.18;
    const ey = d.x * cell * 0.18;
    for (const side of [1, -1]) {
      const cx = head.x + d.x * cell * 0.12 + ex * side;
      const cy = head.y + d.y * cell * 0.12 + ey * side;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(cx + d.x * cell * 0.04, cy + d.y * cell * 0.04, cell * 0.055, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const finish = () => {
    feedback("error", { el: boardRef.current });
    setStatus("over");
    const isBest = onFinish(g.current.score);
    setNewBest(isBest);
    if (isBest) feedback("success");
  };

  /** One tick. Returns false when the snake crashed. */
  const step = (): boolean => {
    const s = g.current;
    const next = s.queue.shift();
    if (next) s.dir = next;
    const d = DELTA[s.dir];
    const head = { x: s.snake[0].x + d.x, y: s.snake[0].y + d.y };
    const eats = head.x === s.food.x && head.y === s.food.y;
    const body = eats ? s.snake : s.snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || body.some((p) => p.x === head.x && p.y === head.y)) {
      finish();
      return false;
    }
    s.prev = s.snake;
    s.snake = [head, ...body];
    if (eats) {
      s.score += 1;
      setScore(s.score);
      s.ms = Math.max(MIN_MS, s.ms - SPEED_UP);
      s.eaten = { p: head, t: performance.now() };
      s.food = randomFood(s.snake);
      feedback("tap");
    }
    return true;
  };

  // The loop reads these through refs, so a theme or size change mid-game takes effect at once.
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const stepRef = useRef(step);
  stepRef.current = step;

  // Canvas size (crisp on high-DPI screens).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(px * dpr);
    canvas.height = Math.round(px * dpr);
    drawRef.current(1);
  }, [px, colors]);

  // Game loop: fixed-step logic, drawn every frame. Static frames otherwise.
  useEffect(() => {
    if (status !== "playing") {
      drawRef.current(1);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const s = g.current;
      s.acc = Math.min(s.acc + (now - last), s.ms * 3);
      last = now;
      while (s.acc >= s.ms) {
        s.acc -= s.ms;
        if (!stepRef.current()) {
          drawRef.current(1);
          return;
        }
      }
      drawRef.current(s.acc / s.ms);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  const start = (dir?: Dir) => {
    if (statusRef.current === "over" || statusRef.current === "ready") {
      g.current = fresh();
      g.current.food = randomFood(g.current.snake);
      setScore(0);
      setNewBest(false);
    }
    if (dir && dir !== "left") g.current.dir = dir;
    setStatus("playing");
    boardRef.current?.focus({ preventScroll: true });
  };

  const turn = (d: Dir) => {
    const st = statusRef.current;
    if (st === "ready" || st === "over") return start(d);
    if (st === "paused") setStatus("playing");
    const q = g.current.queue;
    const lastDir = q.length ? q[q.length - 1] : g.current.dir;
    if (d === lastDir || d === OPPOSITE[lastDir] || q.length >= 2) return;
    q.push(d);
  };

  const togglePause = () => {
    const st = statusRef.current;
    if (st === "playing") setStatus("paused");
    else if (st === "paused") setStatus("playing");
  };

  useSwipe(boardRef, turn, { chain: true, threshold: 22 });
  useOnHidden(() => statusRef.current === "playing" && setStatus("paused"));

  const onKeyDown = (e: React.KeyboardEvent) => {
    const d = keyDir(e);
    if (d) {
      e.preventDefault();
      turn(d);
    } else if (e.key === " " || e.key.toLowerCase() === "p") {
      e.preventDefault();
      if (statusRef.current === "ready" || statusRef.current === "over") start();
      else togglePause();
    } else if (e.key === "Enter" && (statusRef.current === "ready" || statusRef.current === "over")) {
      e.preventDefault();
      start();
    }
  };

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "Score", value: score },
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
        className="game-board glass glass-flat"
        style={{ width: px + 16, height: px + 16 }}
        tabIndex={0}
        role="application"
        aria-label="Snake board. Use the arrow keys to steer, space to pause."
        onKeyDown={onKeyDown}
        onBlur={() => statusRef.current === "playing" && !touch && setStatus("paused")}
      >
        <canvas ref={canvasRef} style={{ width: px, height: px }} aria-hidden="true" />
        {status === "ready" && (
          <Overlay
            title="Snake"
            body={touch ? "Swipe on the board to steer." : "Arrow keys or WASD to steer."}
            action="Play"
            onAction={() => start()}
          />
        )}
        {status === "paused" && <Overlay title="Paused" body="Press space or tap Resume." action="Resume" onAction={togglePause} />}
        {status === "over" && (
          <Overlay
            title={`Game over · ${score} ${score === 1 ? "point" : "points"}`}
            badge={newBest ? "New best!" : undefined}
            body={best !== undefined && !newBest ? `Your best is ${best}.` : undefined}
            action="Play again"
            onAction={() => start()}
          />
        )}
      </div>

      {touch && (
        <div className="game-dpad" aria-label="Direction buttons">
          {(["up", "left", "right", "down"] as Dir[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`game-dpad-${d} glass glass-flat glass-press`}
              aria-label={`Turn ${d}`}
              onPointerDown={(e) => {
                e.preventDefault();
                turn(d);
              }}
            >
              <span className={`${ARROW[d]} text-[20px]`} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
