import type React from "react";
import { feedback } from "~/sensory/feedback";
import type { GameProps } from "./types";
import { Overlay, Stats, ToolButton } from "./ui";

const W = 9;
const H = 9;
const MINES = 10;
const LONG_PRESS_MS = 380;

interface Cell {
  mine: boolean;
  n: number;
  open: boolean;
  flag: boolean;
  boom?: boolean;
}
type Status = "ready" | "playing" | "won" | "lost";

const empty = (): Cell[] => Array.from({ length: W * H }, () => ({ mine: false, n: 0, open: false, flag: false }));

const neighbours = (i: number): number[] => {
  const x = i % W;
  const y = Math.floor(i / W);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push(ny * W + nx);
    }
  return out;
};

/** Lays the mines after the first click, never on or around the clicked cell. */
const layMines = (cells: Cell[], safe: number): Cell[] => {
  const banned = new Set([safe, ...neighbours(safe)]);
  const spots = cells.map((_, i) => i).filter((i) => !banned.has(i));
  for (let k = 0; k < MINES; k++) {
    const j = k + Math.floor(Math.random() * (spots.length - k));
    [spots[k], spots[j]] = [spots[j], spots[k]];
  }
  const next = cells.map((c) => ({ ...c }));
  spots.slice(0, MINES).forEach((i) => (next[i].mine = true));
  next.forEach((c, i) => (c.n = neighbours(i).filter((j) => next[j].mine).length));
  return next;
};

/** Opens `start`, flooding outward across zeros. */
const flood = (cells: Cell[], start: number): Cell[] => {
  const next = cells.map((c) => ({ ...c }));
  const queue = [start];
  while (queue.length) {
    const i = queue.pop()!;
    const c = next[i];
    if (c.open || c.flag) continue;
    c.open = true;
    if (c.n === 0 && !c.mine) neighbours(i).forEach((j) => !next[j].open && queue.push(j));
  }
  return next;
};

export default function Minesweeper({ size, onFinish, best }: GameProps) {
  const board = Math.min(size, 420);
  const gap = 3;
  const cell = Math.floor((board - gap * (W + 1)) / W);
  const [cells, setCells] = useState<Cell[]>(empty);
  const [status, setStatus] = useState<Status>("ready");
  const [flagMode, setFlagMode] = useState(false);
  const [started, setStarted] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [focus, setFocus] = useState(Math.floor((W * H) / 2));
  const [newBest, setNewBest] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false });
  const flags = cells.filter((c) => c.flag).length;
  const over = status === "won" || status === "lost";

  useEffect(() => {
    if (status !== "playing" || started === null) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => clearInterval(t);
  }, [status, started]);

  const settle = (next: Cell[], i: number) => {
    if (next[i].mine && next[i].open) {
      next[i].boom = true;
      next.forEach((c) => c.mine && (c.open = true));
      setCells(next);
      setStatus("lost");
      feedback("error", { el: gridRef.current });
      return;
    }
    if (next.every((c) => c.mine || c.open)) {
      next.forEach((c) => c.mine && (c.flag = true));
      setCells(next);
      setStatus("won");
      const time = Math.max(1, Math.round((Date.now() - (started ?? Date.now())) / 1000));
      setSeconds(time);
      const isBest = onFinish(time);
      setNewBest(isBest);
      feedback("success");
      return;
    }
    setCells(next);
  };

  const reveal = (i: number) => {
    if (over) return;
    let base = cells;
    if (status === "ready") {
      base = layMines(cells, i);
      setStatus("playing");
      setStarted(Date.now());
    }
    const c = base[i];
    if (c.flag) return;
    if (c.open) {
      // Chord: a number with all its flags placed opens the rest of its neighbours.
      const around = neighbours(i);
      if (!c.n || around.filter((j) => base[j].flag).length !== c.n) return;
      let next = base;
      let hit = -1;
      for (const j of around) {
        if (next[j].flag || next[j].open) continue;
        if (next[j].mine) hit = j;
        next = next[j].mine ? next.map((x, k) => (k === j ? { ...x, open: true } : x)) : flood(next, j);
      }
      feedback("tap");
      settle(next.map((x) => ({ ...x })), hit >= 0 ? hit : i);
      return;
    }
    feedback(c.n === 0 && !c.mine ? "swipe" : "tap");
    const next = c.mine ? base.map((x, k) => (k === i ? { ...x, open: true } : { ...x })) : flood(base, i);
    settle(next, i);
  };

  const toggleFlag = (i: number) => {
    if (over || cells[i].open || status === "ready") return;
    feedback("selection");
    setCells((cs) => cs.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)));
  };

  const act = (i: number) => (flagMode ? toggleFlag(i) : reveal(i));

  const restart = () => {
    setCells(empty());
    setStatus("ready");
    setStarted(null);
    setSeconds(0);
    setNewBest(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: W, ArrowUp: -W }[e.key];
    if (step) {
      e.preventDefault();
      const n = Math.min(W * H - 1, Math.max(0, focus + step));
      setFocus(n);
      gridRef.current?.querySelectorAll<HTMLButtonElement>("button")[n]?.focus();
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      toggleFlag(focus);
    }
  };

  const label = (c: Cell, i: number) => {
    const pos = `row ${Math.floor(i / W) + 1}, column ${(i % W) + 1}`;
    if (c.flag && !c.open) return `${pos}, flagged`;
    if (!c.open) return `${pos}, hidden`;
    if (c.mine) return `${pos}, mine`;
    return `${pos}, ${c.n || "empty"}`;
  };

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "Mines", value: MINES - flags },
          { label: "Time", value: `${seconds} s` },
          { label: "Best", value: best !== undefined ? `${best} s` : "—" }
        ]}
      >
        <ToolButton
          label={flagMode ? "Flag mode on" : "Flag mode off"}
          icon="i-ph:flag-fill"
          pressed={flagMode}
          onClick={() => setFlagMode((f) => !f)}
        />
        <ToolButton label="New game" icon="i-ph:arrow-counter-clockwise-bold" onClick={restart} />
      </Stats>

      <div className="relative">
        <div
          ref={gridRef}
          className={`game-mines glass glass-flat${status === "lost" ? " is-lost" : ""}`}
          style={{ gap, padding: gap, gridTemplateColumns: `repeat(${W}, ${cell}px)` }}
          role="grid"
          aria-label={`Minesweeper, ${MINES - flags} mines left`}
          onKeyDown={onKeyDown}
        >
          {cells.map((c, i) => (
            <button
              key={i}
              type="button"
              role="gridcell"
              tabIndex={i === focus ? 0 : -1}
              className={`game-mine-cell${c.open ? " is-open" : ""}${c.boom ? " is-boom" : ""}`}
              style={{ width: cell, height: cell, color: c.open && !c.mine ? `var(--game-${c.n})` : undefined }}
              aria-label={label(c, i)}
              onFocus={() => setFocus(i)}
              onClick={() => {
                if (press.current.fired) {
                  press.current.fired = false;
                  return;
                }
                act(i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleFlag(i);
              }}
              onPointerDown={(e) => {
                if (e.pointerType === "mouse") return;
                press.current.fired = false;
                press.current.timer = setTimeout(() => {
                  press.current.fired = true;
                  toggleFlag(i);
                }, LONG_PRESS_MS);
              }}
              onPointerUp={() => clearTimeout(press.current.timer)}
              onPointerLeave={() => clearTimeout(press.current.timer)}
            >
              {c.flag && !c.open ? (
                <span className="i-ph:flag-fill text-[var(--danger)]" aria-hidden="true" />
              ) : c.open && c.mine ? (
                <span className="i-ph:bomb-fill" aria-hidden="true" />
              ) : c.open && c.n ? (
                <span aria-hidden="true">{c.n}</span>
              ) : null}
            </button>
          ))}
        </div>
        {status === "won" && (
          <Overlay
            title={`Cleared in ${seconds} s`}
            badge={newBest ? "New best!" : undefined}
            body="Every mine found."
            action="Play again"
            onAction={restart}
          />
        )}
        {status === "lost" && (
          <Overlay title="Boom!" body="That was a mine. The first click is always safe." action="Try again" onAction={restart} />
        )}
      </div>
    </div>
  );
}
