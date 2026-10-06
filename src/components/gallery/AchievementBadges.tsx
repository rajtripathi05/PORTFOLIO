import type { Achievement } from "~/data/portfolio";

/** Result, prize (tabular numbers) and team-size tags for an achievement. */
export default function AchievementBadges({ a }: { a: Achievement }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {a.result && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-footnote font-bold ${
            a.result === "Winner" ? "bg-accent text-on-accent" : "bg-accent-soft text-accent-text"
          }`}
        >
          {a.result}
        </span>
      )}
      {a.prize && (
        <span className="hstack gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-footnote font-bold tabular-nums text-accent-text">
          <span className="i-ph:medal-bold text-[13px]" aria-hidden="true" />
          {a.prize}
        </span>
      )}
      <span className="hstack gap-1 rounded-full bg-panel-3 px-2.5 py-0.5 text-footnote font-medium text-ink-2">
        <span
          className={`${a.teamSize === "Solo" ? "i-ph:user-bold" : "i-ph:users-three-bold"} text-[13px]`}
          aria-hidden="true"
        />
        {a.teamSize}
      </span>
    </div>
  );
}
