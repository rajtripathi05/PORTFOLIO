import type React from "react";
import { feedback } from "~/sensory/feedback";
import type { GameProps } from "./types";
import { Stats } from "./ui";

type Mark = "X" | "O" | null;
type Level = "relaxed" | "unbeatable";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const winner = (b: Mark[]): { mark: Mark; line: number[] } | null => {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a], line };
  }
  return null;
};
const full = (b: Mark[]) => b.every(Boolean);

/** Perfect play: +10 for an O win, −10 for an X win, preferring faster wins. */
const minimax = (b: Mark[], turn: "X" | "O", depth: number): number => {
  const w = winner(b);
  if (w) return w.mark === "O" ? 10 - depth : depth - 10;
  if (full(b)) return 0;
  const scores = b.flatMap((m, i) => {
    if (m) return [];
    const next = b.slice();
    next[i] = turn;
    return [minimax(next, turn === "O" ? "X" : "O", depth + 1)];
  });
  return turn === "O" ? Math.max(...scores) : Math.min(...scores);
};

const bestMove = (b: Mark[]): number => {
  let best = -Infinity;
  let moves: number[] = [];
  b.forEach((m, i) => {
    if (m) return;
    const next = b.slice();
    next[i] = "O";
    const s = minimax(next, "X", 1);
    if (s > best) {
      best = s;
      moves = [i];
    } else if (s === best) moves.push(i);
  });
  return moves[Math.floor(Math.random() * moves.length)];
};

/** Relaxed: takes a win, blocks you half the time, otherwise plays anywhere. */
const relaxedMove = (b: Mark[]): number => {
  const free = b.flatMap((m, i) => (m ? [] : [i]));
  const finishing = (mark: "X" | "O") =>
    free.find((i) => {
      const next = b.slice();
      next[i] = mark;
      return winner(next)?.mark === mark;
    });
  const win = finishing("O");
  if (win !== undefined) return win;
  const block = finishing("X");
  if (block !== undefined && Math.random() < 0.5) return block;
  return free[Math.floor(Math.random() * free.length)];
};

export default function TicTacToe({ size, onFinish, best }: GameProps) {
  const board = Math.min(size, 560);
  const [cells, setCells] = useState<Mark[]>(Array(9).fill(null));
  const [level, setLevel] = useState<Level>("relaxed");
  const [round, setRound] = useState(0);
  const [tally, setTally] = useState({ you: 0, draw: 0, cpu: 0 });
  const [streak, setStreak] = useState(0);
  const [focus, setFocus] = useState(4);
  const [thinking, setThinking] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const result = winner(cells);
  const done = !!result || full(cells);
  const youStart = round % 2 === 0;

  const conclude = (b: Mark[]) => {
    const w = winner(b);
    if (!w && !full(b)) return false;
    if (w?.mark === "X") {
      setTally((t) => ({ ...t, you: t.you + 1 }));
      const s = streak + 1;
      setStreak(s);
      onFinish(s);
      feedback("success");
    } else if (w?.mark === "O") {
      setTally((t) => ({ ...t, cpu: t.cpu + 1 }));
      setStreak(0);
      feedback("error", { el: gridRef.current });
    } else {
      setTally((t) => ({ ...t, draw: t.draw + 1 }));
      feedback("toggle");
    }
    return true;
  };

  const computer = (b: Mark[]) => {
    setThinking(true);
    setTimeout(() => {
      const i = level === "unbeatable" ? bestMove(b) : relaxedMove(b);
      const next = b.slice();
      next[i] = "O";
      setCells(next);
      setThinking(false);
      feedback("tap");
      conclude(next);
    }, 380);
  };

  // The computer opens every other round.
  useEffect(() => {
    if (!youStart && cells.every((c) => !c)) computer(cells);
  }, [round]);

  const play = (i: number, el: HTMLElement) => {
    if (cells[i] || done || thinking) return;
    const next = cells.slice();
    next[i] = "X";
    setCells(next);
    feedback("tap", { el });
    if (!conclude(next)) computer(next);
  };

  const nextRound = () => {
    setCells(Array(9).fill(null));
    setRound((r) => r + 1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = Math.min(8, Math.max(0, focus + step));
    setFocus(n);
    gridRef.current?.querySelectorAll<HTMLButtonElement>("button")[n]?.focus();
  };

  const status = result
    ? result.mark === "X"
      ? "You win this round!"
      : "The computer wins this round."
    : done
      ? "It's a draw."
      : thinking
        ? "Computer is thinking…"
        : "Your move (you're X).";

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "You", value: tally.you },
          { label: "Draws", value: tally.draw },
          { label: "Computer", value: tally.cpu },
          { label: "Best streak", value: best ?? "—" }
        ]}
      />

      <div role="radiogroup" aria-label="Difficulty" className="game-segmented glass glass-flat">
        {(["relaxed", "unbeatable"] as Level[]).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={level === l}
            className={level === l ? "is-on" : ""}
            onClick={() => {
              feedback("selection");
              setLevel(l);
              setStreak(0);
              nextRound();
            }}
          >
            {l === "relaxed" ? "Relaxed" : "Unbeatable"}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="game-ttt glass glass-flat"
        style={{ width: board, height: board }}
        role="grid"
        aria-label="Tic-tac-toe board"
        onKeyDown={onKeyDown}
      >
        {cells.map((m, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            tabIndex={i === focus ? 0 : -1}
            className={`game-ttt-cell${result?.line.includes(i) ? " is-win" : ""}`}
            onClick={(e) => play(i, e.currentTarget)}
            onFocus={() => setFocus(i)}
            aria-label={`Square ${i + 1}: ${m ?? "empty"}`}
            disabled={!!m || done || thinking}
          >
            {m && <span className={`game-ttt-mark is-${m.toLowerCase()}`}>{m === "X" ? "✕" : "◯"}</span>}
          </button>
        ))}
      </div>

      <p className="game-hint" aria-live="polite">
        {status}
        {done && (
          <button type="button" className="btn-primary btn-sm ml-3 !rounded-full" onClick={nextRound} autoFocus>
            Next round
          </button>
        )}
      </p>
    </div>
  );
}
