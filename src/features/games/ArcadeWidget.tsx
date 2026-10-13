import type { OpenFrom } from "~/shells/shared/Widgets";
import { feedback } from "~/sensory/feedback";
import { formatScore, games } from "./registry";
import { useArcade } from "./scores";

/** Home-screen / desktop widget: the game line-up and the visitor's latest best. */
export function ArcadeWidget({ open }: { open: OpenFrom }) {
  const best = useArcade((s) => s.best);
  // A best worth bragging about: any time or move count, or a points score above zero.
  const highlight = games.find((g) => {
    const b = best[g.id];
    return b !== undefined && (g.lowerIsBetter || b > 0);
  });

  return (
    <button
      type="button"
      className="widget glass min-h-[148px]"
      onClick={(e) => {
        feedback("tap", { el: e.currentTarget });
        open("arcade", e.currentTarget);
      }}
      aria-label={`Arcade: ${games.length} games. Open Arcade`}
    >
      <span className="widget-label">
        <span className="widget-glyph tile-arcade" aria-hidden="true">
          <span className="i-ph:game-controller-fill text-[17px]" />
        </span>
        Arcade
      </span>
      <span className="mt-2.5 flex gap-1.5" aria-hidden="true">
        {games.slice(0, 4).map((g) => (
          <span key={g.id} className={`arcade-mini ${g.tile}`}>
            <span className={`${g.glyph} text-[15px]`} />
          </span>
        ))}
      </span>
      <span className="mt-auto pt-2 text-footnote font-semibold leading-snug">
        {highlight ? `${highlight.title} best: ${formatScore(highlight, best[highlight.id]!)}` : `${games.length} games to play`}
      </span>
      <span className="text-caption font-semibold text-accent-text">Play now →</span>
    </button>
  );
}
