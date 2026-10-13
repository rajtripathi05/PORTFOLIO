import type React from "react";
import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type RefObject } from "react";
import { useAppBack, useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import { formatScore, games, getGame, type GameDef, type GameId, type GameProps } from "~/features/games/registry";
import { useArcade } from "~/features/games/scores";
import { isCoarsePointer } from "~/shells/device";

const cache = new Map<GameId, LazyExoticComponent<ComponentType<GameProps>>>();
const component = (g: GameDef) => {
  let c = cache.get(g.id);
  if (!c) {
    c = lazy(g.load);
    cache.set(g.id, c);
  }
  return c;
};

/** Room a game needs above its board: the score chips row and its gap. */
const STATS_RESERVE = 64;

/**
 * Measures the free area under the header and returns the largest square a board can
 * use there, in portrait and landscape alike.
 */
function useBoardSize(ref: RefObject<HTMLElement>): number {
  const [size, setSize] = useState(360);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize(Math.max(220, Math.floor(Math.min(width, height - STATS_RESERVE))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return size;
}

/** Desktop: a running game gets the whole screen; the window restores when it ends. */
function useMaximizeWhilePlaying(): void {
  const { shell, id } = useAppHost();
  useEffect(() => {
    if (shell !== "desktop") return;
    const st = useStore.getState();
    const wasMax = !!st.windows[id]?.max;
    if (!wasMax) st.toggleMaxApp(id);
    return () => {
      const now = useStore.getState();
      // Leave it alone if the visitor already restored it, or closed the window.
      if (!wasMax && now.windows[id]?.max) now.toggleMaxApp(id);
    };
  }, []);
}

function GameView({ game, onExit }: { game: GameDef; onExit: () => void }) {
  const { shell } = useAppHost();
  const best = useArcade((s) => s.best[game.id]);
  const areaRef = useRef<HTMLDivElement>(null);
  const size = useBoardSize(areaRef);
  const Game = component(game);
  const touch = useMemo(isCoarsePointer, []);
  useMaximizeWhilePlaying();

  // Escape leaves the game (desktop; touch shells use their back button). Handled here,
  // not globally, so it only applies while focus is in this window; preventDefault
  // stops the desktop from also closing the window.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape" || shell !== "desktop" || e.defaultPrevented) return;
    e.preventDefault();
    onExit();
  };

  const hintId = `game-hint-${game.id}`;
  return (
    <div className="flex h-full flex-col" onKeyDown={onKeyDown} aria-describedby={hintId}>
      {/* One thin header on the desktop; touch shells already show "‹ Arcade" in their bar. */}
      {shell === "desktop" && (
        <div className="flex flex-none items-center gap-2 px-3 pt-2">
          <button type="button" className="btn-ghost btn-sm !px-2" onClick={onExit} title="Esc to leave">
            <span className="i-ph:caret-left-bold" aria-hidden="true" />
            All games
          </button>
          <span className={`arcade-mini !size-6 !rounded-[7px] ${game.tile}`} aria-hidden="true">
            <span className={`${game.glyph} text-[13px]`} />
          </span>
          <h2 className="text-callout font-bold">{game.title}</h2>
        </div>
      )}
      {shell !== "desktop" && <h2 className="sr-only">{game.title}</h2>}
      <p id={hintId} className="sr-only">
        {touch ? game.controls.touch : game.controls.keys}
      </p>
      <div ref={areaRef} className="game-area min-h-0 flex-1 overflow-y-auto">
        <Suspense
          fallback={
            <div className="skeleton mx-auto mt-6 size-64" role="status">
              <span className="sr-only">Loading game</span>
            </div>
          }
        >
          <Game
            key={game.id}
            size={size}
            best={best}
            onFinish={(score) => useArcade.getState().record(game.id, score, game.lowerIsBetter)}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function Arcade() {
  const { shell, width, params, nonce } = useAppHost();
  const best = useArcade((s) => s.best);
  const [gameId, setGameId] = useState<GameId | null>(() => getGame(params?.id)?.id ?? null);
  const game = getGame(gameId ?? undefined);
  const cols = width >= 900 ? 3 : width >= 360 ? 2 : 1;

  // Deep links and Spotlight re-open the app with a game id.
  useEffect(() => {
    const g = getGame(params?.id);
    if (g) setGameId(g.id);
  }, [nonce]);

  const exit = () => setGameId(null);
  useAppBack(!!game, "Arcade", exit);

  if (game) return <GameView game={game} onExit={exit} />;

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[920px] px-5 pb-8 pt-6">
        <h1 className="app-h1">Arcade</h1>
        <p className="mt-1 max-w-[60ch] text-body text-ink-2">
          Raj co-founded SIG Game Development and MeshCraft, a 3D asset &amp; AI tooling startup for game developers.
          Pick a game; your best scores stay in this browser.
        </p>
        <ul className="arcade-grid mt-5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {games.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="arcade-card glass glass-flat"
                onPointerEnter={() => void g.load()}
                onFocus={() => void g.load()}
                onClick={(e) => {
                  feedback("open", { el: e.currentTarget });
                  setGameId(g.id);
                }}
              >
                <span className={`arcade-art ${g.tile}`}>
                  <span className={`${g.glyph} arcade-art-glyph`} aria-hidden="true" />
                  <span className="arcade-best">
                    {best[g.id] === undefined ? "Not played yet" : `Best: ${formatScore(g, best[g.id]!)}`}
                  </span>
                </span>
                <span className="block px-4 pb-4 pt-3">
                  <span className="block text-callout font-bold">{g.title}</span>
                  <span className="mt-1 block text-footnote leading-snug text-ink-2">{g.tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
