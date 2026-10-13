import type React from "react";
import type { AppId } from "~/types";
import { achievementTitle, portfolio } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";
import type { GameProps } from "./types";
import { shuffle } from "./input";
import { Overlay, Stats, ToolButton } from "./ui";

interface Pair {
  glyph: string;
  tile: string;
  /** What the picture stands for, from the portfolio content. */
  fact: string;
  app: AppId;
}

const { experience, leadership, projects, achievements, education, certificationsSummary } = portfolio;
const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id);

// Every pair is a true fact from src/data/portfolio.ts (looked up by id, so edits flow through).
const candidates = (): Pair[] => {
  const out: (Pair | null)[] = [];
  const top = achievements[0];
  out.push(top ? { glyph: "i-ph:trophy-fill", tile: "tile-achievements", fact: `${achievements.length} awards, including ${achievementTitle(top)}`, app: "achievements" } : null);
  const nsu = byId(projects, "nsu");
  out.push(nsu ? { glyph: "i-ph:factory-fill", tile: "tile-projects", fact: `${nsu.title}: ${nsu.descriptor ?? ""}`.replace(/: $/, ""), app: "projects" } : null);
  const igl = byId(experience, "india-glycols");
  out.push(igl ? { glyph: "i-ph:briefcase-fill", tile: "tile-experience", fact: `${igl.role} at ${igl.org} (${igl.dates})`, app: "experience" } : null);
  const mesh = byId(experience, "meshcraft");
  out.push(mesh ? { glyph: "i-ph:cube-fill", tile: "tile-ai", fact: `${mesh.role}, ${mesh.org}`, app: "experience" } : null);
  const sig = byId(leadership, "sig-gamedev");
  out.push(sig ? { glyph: "i-ph:game-controller-fill", tile: "tile-arcade", fact: `${sig.role}, SIG Game Development`, app: "leadership" } : null);
  out.push({ glyph: "i-ph:graduation-cap-fill", tile: "tile-about", fact: `${education.degree}, ${education.school}`, app: "about" });
  out.push({ glyph: "i-ph:certificate-fill", tile: "tile-certifications", fact: certificationsSummary, app: "certifications" });
  const tbdos = byId(projects, "tbdos");
  out.push(tbdos ? { glyph: "i-ph:lightning-fill", tile: "tile-skills", fact: `${tbdos.title}: ${tbdos.descriptor ?? ""}`.replace(/: $/, ""), app: "projects" } : null);
  const vision = byId(experience, "team-vision");
  out.push(vision ? { glyph: "i-ph:google-cardboard-logo-fill", tile: "tile-research", fact: `${vision.role}, ${vision.org}`, app: "experience" } : null);
  return out.filter((p): p is Pair => !!p).slice(0, 8);
};

const PAIRS = candidates();

const deal = () => shuffle(PAIRS.flatMap((_, i) => [i, i])).map((pair, i) => ({ key: i, pair }));

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function Memory({ size, onFinish, best }: GameProps) {
  const board = Math.min(size, 440);
  const cols = 4;
  const gap = Math.round(board * 0.025);
  const [deck, setDeck] = useState(deal);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [lastFact, setLastFact] = useState<Pair | null>(null);
  const [won, setWon] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [focus, setFocus] = useState(0);
  const lock = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const openApp = useStore((s) => s.openApp);

  useEffect(() => {
    if (started === null || won) return;
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(t);
  }, [started, won]);

  const flip = (i: number, el: HTMLElement) => {
    if (lock.current || open.includes(i) || matched.has(deck[i].pair) || won) return;
    if (started === null) setStarted(Date.now());
    const next = [...open, i];
    setOpen(next);
    feedback("selection", { el });
    if (next.length < 2) return;
    const m = moves + 1;
    setMoves(m);
    const [a, b] = next.map((k) => deck[k].pair);
    if (a === b) {
      const all = new Set(matched).add(a);
      setMatched(all);
      setOpen([]);
      setLastFact(PAIRS[a]);
      feedback("toggle");
      if (all.size === PAIRS.length) {
        setWon(true);
        const isBest = onFinish(m);
        setNewBest(isBest);
        feedback("success");
      }
    } else {
      lock.current = true;
      setTimeout(() => {
        setOpen([]);
        lock.current = false;
      }, 800);
    }
  };

  const restart = () => {
    setDeck(deal());
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setStarted(null);
    setSeconds(0);
    setLastFact(null);
    setWon(false);
    setNewBest(false);
    lock.current = false;
  };

  // Arrow keys move between cards (one Tab stop for the whole grid).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = (focus + step + deck.length) % deck.length;
    setFocus(n);
    gridRef.current?.querySelectorAll<HTMLButtonElement>("button")[n]?.focus();
  };

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "Moves", value: moves },
          { label: "Time", value: clock(seconds) },
          { label: "Best", value: best !== undefined ? `${best} moves` : "—" }
        ]}
      >
        <ToolButton label="New game" icon="i-ph:arrow-counter-clockwise-bold" onClick={restart} />
      </Stats>

      <div className="relative" style={{ width: board }}>
        <div
          ref={gridRef}
          className="game-memory"
          style={{ gap, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          role="grid"
          aria-label="Memory cards"
          onKeyDown={onKeyDown}
        >
          {deck.map((card, i) => {
            const shown = open.includes(i) || matched.has(card.pair);
            const pair = PAIRS[card.pair];
            return (
              <button
                key={card.key}
                type="button"
                role="gridcell"
                tabIndex={i === focus ? 0 : -1}
                className={`game-card${shown ? " is-open" : ""}${matched.has(card.pair) ? " is-matched" : ""}`}
                onClick={(e) => flip(i, e.currentTarget)}
                onFocus={() => setFocus(i)}
                aria-label={shown ? pair.fact : `Card ${i + 1}, face down`}
                aria-pressed={shown}
              >
                <span className="game-card-inner">
                  <span className="game-card-back glass glass-flat" aria-hidden="true">
                    <span className="i-ph:sparkle-fill text-[20px] opacity-60" />
                  </span>
                  <span className={`game-card-front ${pair.tile}`} aria-hidden="true">
                    <span className={`${pair.glyph} text-[34px]`} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {won && (
          <Overlay
            title={`All pairs in ${moves} moves`}
            badge={newBest ? "New best!" : undefined}
            body={`Time ${clock(seconds)}.`}
            action="Play again"
            onAction={restart}
          />
        )}
      </div>

      <p className="game-fact" aria-live="polite">
        {lastFact ? (
          <>
            <span className={`${lastFact.glyph} mr-1.5 text-accent-text`} aria-hidden="true" />
            <span>{lastFact.fact}</span>{" "}
            <button type="button" className="text-link font-semibold" onClick={() => openApp(lastFact.app)}>
              Read more
            </button>
          </>
        ) : (
          "Find the pairs. Each match reveals a fact about Raj."
        )}
      </p>
    </div>
  );
}
