import type React from "react";
import { feedback } from "~/sensory/feedback";
import type { GameProps } from "./types";
import { keyDir, useSwipe, type Dir } from "./input";
import { Overlay, Stats, ToolButton } from "./ui";

const SIZE = 4;
const SLIDE_MS = 110;

interface Tile {
  id: number;
  value: number;
  r: number;
  c: number;
  /** Slid into a merge this move; removed after the slide. */
  gone?: boolean;
  merged?: boolean;
  fresh?: boolean;
}
type Status = "playing" | "won" | "over";

let nextId = 1;

const spawn = (tiles: Tile[]): Tile | null => {
  const taken = new Set(tiles.filter((t) => !t.gone).map((t) => t.r * SIZE + t.c));
  const free: number[] = [];
  for (let i = 0; i < SIZE * SIZE; i++) if (!taken.has(i)) free.push(i);
  if (!free.length) return null;
  const i = free[Math.floor(Math.random() * free.length)];
  return { id: nextId++, value: Math.random() < 0.9 ? 2 : 4, r: Math.floor(i / SIZE), c: i % SIZE, fresh: true };
};

const newBoard = (): Tile[] => {
  const a = spawn([])!;
  const b = spawn([a])!;
  return [a, b];
};

/** Slides every tile toward `dir`, merging equal neighbours once per move. */
const slide = (tiles: Tile[], dir: Dir): { tiles: Tile[]; gained: number; moved: boolean } => {
  const live = tiles.filter((t) => !t.gone).map((t) => ({ ...t, merged: false, fresh: false }));
  const out: Tile[] = [];
  let gained = 0;
  let moved = false;
  const vertical = dir === "up" || dir === "down";
  const forward = dir === "down" || dir === "right";
  for (let line = 0; line < SIZE; line++) {
    const row = live
      .filter((t) => (vertical ? t.c === line : t.r === line))
      .sort((a, b) => (vertical ? a.r - b.r : a.c - b.c) * (forward ? -1 : 1));
    let slot = 0;
    let mergeable: Tile | null = null;
    for (const t of row) {
      const pos = (s: number) => (forward ? SIZE - 1 - s : s);
      if (mergeable && mergeable.value === t.value) {
        const at = { r: mergeable.r, c: mergeable.c };
        out.push({ ...t, ...at, gone: true });
        mergeable.gone = true;
        const merged: Tile = { id: nextId++, value: t.value * 2, ...at, merged: true };
        out.push(merged);
        gained += merged.value;
        moved = true;
        mergeable = null;
      } else {
        const p = pos(slot++);
        const r = vertical ? p : t.r;
        const c = vertical ? t.c : p;
        if (r !== t.r || c !== t.c) moved = true;
        const placed = { ...t, r, c };
        out.push(placed);
        mergeable = placed;
      }
    }
  }
  return { tiles: out, gained, moved };
};

const canMove = (tiles: Tile[]): boolean => {
  const live = tiles.filter((t) => !t.gone);
  if (live.length < SIZE * SIZE) return true;
  const at = (r: number, c: number) => live.find((t) => t.r === r && t.c === c)?.value;
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = at(r, c);
      if (v === at(r + 1, c) || v === at(r, c + 1)) return true;
    }
  return false;
};

export default function Game2048({ size, onFinish, best }: GameProps) {
  const board = Math.min(size, 680);
  const gap = Math.round(board * 0.028);
  const cell = (board - gap * (SIZE + 1)) / SIZE;
  const [tiles, setTiles] = useState<Tile[]>(newBoard);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<Status>("playing");
  const [keepGoing, setKeepGoing] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const state = useRef({ tiles, score, status, keepGoing });
  state.current = { tiles, score, status, keepGoing };

  const finish = (final: number) => {
    const isBest = onFinish(final);
    setNewBest(isBest);
    if (isBest) feedback("success");
  };

  const move = (dir: Dir) => {
    const s = state.current;
    if (s.status === "over" || (s.status === "won" && !s.keepGoing)) return;
    const { tiles: slid, gained, moved } = slide(s.tiles, dir);
    if (!moved) return;
    const added = spawn(slid);
    const next = added ? [...slid, added] : slid;
    const total = s.score + gained;
    // Keep state.current in step so a key pressed before the next render sees this move.
    s.tiles = next;
    s.score = total;
    setTiles(next);
    setScore(total);
    feedback(gained ? "tap" : "selection");
    // Merged-away tiles finish sliding, then go (only this move's, so fast play is safe).
    const gone = new Set(slid.filter((t) => t.gone).map((t) => t.id));
    if (gone.size) setTimeout(() => setTiles((t) => t.filter((x) => !gone.has(x.id))), SLIDE_MS);
    if (!s.keepGoing && next.some((t) => !t.gone && t.value === 2048)) {
      setStatus("won");
      feedback("success");
    } else if (!canMove(next)) {
      setStatus("over");
      feedback("error", { el: boardRef.current });
      finish(total);
    }
  };

  const restart = () => {
    const s = state.current;
    if (s.status !== "over" && s.score > 0) finish(s.score);
    setTiles(newBoard());
    setScore(0);
    setStatus("playing");
    setKeepGoing(false);
    setNewBest(false);
    boardRef.current?.focus({ preventScroll: true });
  };

  useSwipe(boardRef, move);
  useEffect(() => boardRef.current?.focus({ preventScroll: true }), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const d = keyDir(e);
    if (!d) return;
    e.preventDefault();
    move(d);
  };

  const xy = (r: number, c: number) => `translate(${gap + c * (cell + gap)}px, ${gap + r * (cell + gap)}px)`;
  const ink = (v: number) => (v <= 4 ? "var(--tile-ink-low)" : v >= 2048 ? "var(--tile-ink-top)" : "var(--tile-ink)");

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "Score", value: score.toLocaleString() },
          { label: "Best", value: best !== undefined ? best.toLocaleString() : "—" }
        ]}
      >
        <ToolButton label="New game" icon="i-ph:arrow-counter-clockwise-bold" onClick={restart} />
      </Stats>

      <div
        ref={boardRef}
        className="game-2048 glass glass-flat"
        style={{ width: board, height: board, "--slide": `${SLIDE_MS}ms` } as React.CSSProperties}
        tabIndex={0}
        role="application"
        aria-label={`2048 board, score ${score}. Use the arrow keys or swipe to slide the tiles.`}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: SIZE * SIZE }, (_, i) => (
          <span
            key={i}
            className="game-2048-cell"
            style={{ width: cell, height: cell, transform: xy(Math.floor(i / SIZE), i % SIZE) }}
          />
        ))}
        {tiles.map((t) => (
          // The outer span slides (translate); the face scales (pop / appear) without fighting it.
          <span
            key={t.id}
            className={`game-2048-tile${t.merged ? " is-merged" : ""}${t.fresh ? " is-fresh" : ""}${t.gone ? " is-gone" : ""}`}
            style={{ width: cell, height: cell, transform: xy(t.r, t.c) }}
            aria-hidden="true"
          >
            <span
              className="game-2048-face"
              style={{
                background: `var(--tile-${Math.min(t.value, 2048)})`,
                color: ink(t.value),
                fontSize: cell * (t.value < 100 ? 0.44 : t.value < 1000 ? 0.36 : 0.28)
              }}
            >
              {t.value}
            </span>
          </span>
        ))}
        {status === "won" && !keepGoing && (
          <Overlay
            title="You made 2048!"
            badge="Winner"
            body={`Score ${score.toLocaleString()}. Keep going for a higher tile?`}
            action="Keep going"
            onAction={() => {
              setKeepGoing(true);
              setStatus("playing");
              boardRef.current?.focus({ preventScroll: true });
            }}
          />
        )}
        {status === "over" && (
          <Overlay
            title="No more moves"
            badge={newBest ? "New best!" : undefined}
            body={`Final score ${score.toLocaleString()}.`}
            action="New game"
            onAction={restart}
          />
        )}
      </div>
    </div>
  );
}
