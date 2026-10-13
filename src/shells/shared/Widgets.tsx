import type React from "react";
import type { AppId, AppParams } from "~/types";
import { portfolio } from "~/data/portfolio";
import { previewFor } from "~/data/previews";
import { feedback } from "~/sensory/feedback";

/**
 * Glass widgets shared by the desktop (left column) and the phone/tablet home screen.
 * Every word comes from src/data/portfolio.ts. `open` lets each shell open apps its own
 * way (the touch shells zoom from the tapped widget).
 */
export type OpenFrom = (id: AppId, el: HTMLElement | null, params?: AppParams) => void;

const { identity, education, achievements, projects, stats } = portfolio;

const tap = (open: OpenFrom, id: AppId, params?: AppParams) => (e: React.MouseEvent<HTMLElement>) => {
  feedback("tap", { el: e.currentTarget });
  open(id, e.currentTarget, params);
};

/** Photo, name, degree and the two ways in: the About Me app or the one-page Quick View. */
export function ProfileWidget({ open }: { open: OpenFrom }) {
  return (
    <section className="widget glass" aria-labelledby="widget-name">
      <div className="flex items-center gap-3.5">
        <img
          src={identity.photo}
          alt=""
          width={60}
          height={60}
          className="widget-photo size-[60px]"
          decoding="async"
        />
        <div className="min-w-0">
          <h1 id="widget-name" className="text-headline font-bold leading-tight">
            {identity.name}
          </h1>
          <p className="mt-0.5 text-footnote font-medium leading-snug text-ink-2">{education.degree}</p>
          <p className="text-footnote leading-snug text-ink-2">{education.school}</p>
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <button type="button" className="btn-primary !h-10 !rounded-full" onClick={tap(open, "about")}>
          <span className="i-ph:user-circle-bold" aria-hidden="true" />
          About me
        </button>
        <a href="/quick" className="btn !h-10 !rounded-full glass glass-flat glass-press text-ink-1">
          <span className="i-ph:article-bold" aria-hidden="true" />
          Quick View
        </a>
      </div>
    </section>
  );
}

const wins = achievements.filter((a) => a.result === "Winner").length;
const top = achievements[0];

/** Award count and the headline win; opens Achievements on that award. */
export function AwardsWidget({ open }: { open: OpenFrom }) {
  return (
    <button
      type="button"
      className="widget glass min-h-[148px]"
      onClick={tap(open, "achievements", { id: top.id })}
      aria-label={`${achievements.length} awards, including ${top.name}. Open Achievements`}
    >
      <span className="widget-label">
        <span className="widget-glyph tile-achievements" aria-hidden="true">
          <span className="i-ph:trophy-fill text-[17px]" />
        </span>
        Awards
      </span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span className="widget-big">{achievements.length}</span>
        <span className="whitespace-nowrap text-caption font-semibold text-ink-2">
          {achievements.length === 1 ? "award" : "awards"} · {wins} {wins === 1 ? "win" : "wins"}
        </span>
      </span>
      <span className="mt-auto line-clamp-2 text-footnote font-semibold leading-snug">{top.name}</span>
      <span className="text-caption text-ink-2">{[top.result, top.prize].filter(Boolean).join(" · ")}</span>
    </button>
  );
}

const featured = projects[0];
const featuredPreview = previewFor(featured.id);

/** The first featured project over its live-site screenshot. */
export function FeaturedWidget({ open }: { open: OpenFrom }) {
  return (
    <button
      type="button"
      className="widget widget-featured glass"
      onClick={tap(open, "projects", { id: featured.id })}
      aria-label={`Featured project: ${featured.title}. Open Projects`}
    >
      {featuredPreview && (
        <img
          // Full size: the widget shows it zoomed 1.6x (widgets.css).
          src={featuredPreview.src}
          alt=""
          width={480}
          height={300}
          loading="lazy"
          decoding="async"
          style={{ backgroundColor: featuredPreview.color }}
        />
      )}
      <span className="widget-caption glass glass-thick">
        <span className="widget-label !text-[10.5px]">
          <span className="i-ph:star-four-fill text-accent-text" aria-hidden="true" />
          Featured project
        </span>
        <span className="mt-0.5 block truncate text-callout font-bold">{featured.title}</span>
        {featured.descriptor && (
          <span className="block truncate text-footnote text-ink-2">{featured.descriptor}</span>
        )}
      </span>
    </button>
  );
}

const STAT_PICKS = [0, 2, 3, 5];

/** A few headline numbers (all from the content, see scripts/check-content.mjs). */
export function StatsWidget({ open }: { open: OpenFrom }) {
  const picks = STAT_PICKS.map((i) => stats[i]).filter(Boolean);
  return (
    <button type="button" className="widget glass" onClick={tap(open, "about")} aria-label="Highlights. Open About Me">
      <span className="widget-label">
        <span className="widget-glyph tile-about" aria-hidden="true">
          <span className="i-ph:chart-bar-fill text-[16px]" />
        </span>
        Highlights
      </span>
      <span className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {picks.map((s) => (
          <span key={s.label} className="min-w-0">
            <span className="font-rounded block text-[22px] font-bold leading-none tabular-nums">
              {s.value}
            </span>
            <span className="mt-1 block truncate text-caption text-ink-2">{s.label}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
