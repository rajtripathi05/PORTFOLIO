import { portfolio, type ExperienceItem } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";

const COLLAPSED_BULLETS = 3;

function Role({
  job,
  latest,
  narrow,
  highlight
}: {
  job: ExperienceItem;
  latest: boolean;
  narrow: boolean;
  highlight: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  // Long cards collapse only on narrow screens.
  const collapsible = narrow && job.bullets.length > COLLAPSED_BULLETS;
  const bullets = collapsible && !expanded ? job.bullets.slice(0, COLLAPSED_BULLETS) : job.bullets;

  return (
    <li id={`exp-item-${job.id}`} className="relative scroll-mt-4 pb-5 last:pb-0">
      <span
        className={`absolute -left-[33px] top-5 size-4 rounded-full border-[3px] border-[var(--surface)] ${
          latest ? "bg-accent ring-4 ring-[var(--accent-subtle)]" : "bg-[var(--gray-5)]"
        }`}
        aria-hidden="true"
      />
      <article
        aria-labelledby={`exp-${job.id}`}
        className={`rounded-card border p-4 transition-colors duration-emphasis ${
          highlight
            ? "border-accent bg-accent-soft"
            : latest
              ? "border-hairline bg-panel-2 shadow-resting"
              : "border-transparent"
        }`}
      >
        {latest && <p className="app-h2 mb-1 !text-accent-text">Most recent</p>}
        <div className={`flex gap-x-4 gap-y-1 ${narrow ? "flex-col" : "items-baseline justify-between"}`}>
          <h2 id={`exp-${job.id}`} className="text-callout font-bold leading-snug">
            {job.role}
            <span className="font-normal text-ink-3"> | </span>
            {job.orgUrl ? (
              <a className="text-link font-bold" href={job.orgUrl} target="_blank" rel="noopener noreferrer">
                {job.org}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              job.org
            )}
          </h2>
          <p className="flex-none whitespace-nowrap text-footnote font-medium tabular text-ink-3">
            {job.dates}
            {job.location && <> · {job.location}</>}
          </p>
        </div>
        {job.tagline && <p className="mt-1 italic text-ink-2">{job.tagline}</p>}
        <ul className="bullets measure mt-2.5 text-ink-1">
          {bullets.map((b) => (
            <li key={b}>
              <RichText text={b} links={job.links} />
            </li>
          ))}
        </ul>
        {collapsible && (
          <button
            type="button"
            className="btn-ghost btn-sm -ml-3 mt-2"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show less" : `Show ${job.bullets.length - COLLAPSED_BULLETS} more`}
            <span
              className={`i-ph:caret-down-bold transition-transform duration-micro ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </article>
    </li>
  );
}

export default function Experience() {
  const { width, payload, nonce } = useWindow();
  const narrow = width < 600;
  const rootRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  // Opening with { id } (Spotlight, AI) scrolls to that role and highlights it briefly.
  useEffect(() => {
    const id = payload?.id;
    if (typeof id !== "string") return;
    const t = setTimeout(() => {
      rootRef.current?.querySelector(`#exp-item-${id}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
      setHighlight(id);
    }, 150);
    const t2 = setTimeout(() => setHighlight(null), 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [nonce]);

  return (
    <div ref={rootRef} className="app-scroll">
      <div className="mx-auto max-w-[800px] px-6 py-7 sm:px-9">
        <h1 className="app-h1">Experience</h1>
        <ol className="relative ml-2 mt-6 border-l-2 border-hairline pl-6">
          {portfolio.experience.map((job, i) => (
            <Role key={job.id} job={job} latest={i === 0} narrow={narrow} highlight={highlight === job.id} />
          ))}
        </ol>
      </div>
    </div>
  );
}
