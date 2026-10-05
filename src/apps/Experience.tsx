import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";

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
      <div className="mx-auto max-w-[780px] px-6 py-7 sm:px-9">
        <h1 className="app-h1">Experience</h1>
        <ol className="relative mt-6 border-l-2 border-hairline pl-6">
          {portfolio.experience.map((job) => (
            <li
              key={job.id}
              id={`exp-item-${job.id}`}
              className={`relative -mx-3 mb-4 scroll-mt-4 rounded-xl px-3 py-2 transition-colors duration-500 last:mb-0 ${
                highlight === job.id ? "bg-accent-soft" : ""
              }`}
            >
              <span
                className="absolute -left-[21px] top-3.5 size-4 rounded-full border-[3px] border-panel bg-accent"
                aria-hidden="true"
              />
              <article aria-labelledby={`exp-${job.id}`}>
                <div className={`flex gap-x-4 gap-y-1 ${narrow ? "flex-col" : "items-baseline justify-between"}`}>
                  <h2 id={`exp-${job.id}`} className="text-[16.5px] font-bold leading-snug">
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
                  <p className="flex-none text-[13.5px] font-medium text-ink-3 whitespace-nowrap">
                    {job.dates}
                    {job.location && <> · {job.location}</>}
                  </p>
                </div>
                {job.tagline && <p className="mt-1 italic text-ink-2">{job.tagline}</p>}
                <ul className="bullets mt-2.5 text-ink-1">
                  {job.bullets.map((b) => (
                    <li key={b}>
                      <RichText text={b} links={job.links} />
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
