import { portfolio } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import RoleCard, { roleDomId } from "~/components/content/RoleCard";
import { useScrollTarget } from "~/components/content/useScrollTarget";

const internshipIds = new Set(portfolio.internships.map((r) => r.id));

export default function Experience() {
  const { shell } = useAppHost();
  const touch = shell !== "desktop";
  const rootRef = useRef<HTMLDivElement>(null);
  const [showInterns, setShowInterns] = useState(false);

  // A deep link to an internship opens the collapsed section first, then scrolls to it.
  const highlight = useScrollTarget(rootRef, roleDomId, (id) => {
    if (internshipIds.has(id)) setShowInterns(true);
  });

  return (
    <div ref={rootRef} className="app-scroll">
      <div className={`mx-auto max-w-[800px] py-7 ${shell === "phone" ? "px-4" : "px-6 sm:px-9"}`}>
        <h1 className="app-h1">Experience</h1>

        <ol className={`relative mt-6 border-l-2 border-hairline ${shell === "phone" ? "ml-1 pl-4" : "ml-2 pl-6"}`}>
          {portfolio.experience.map((job, i) => (
            <li key={job.id} className="relative pb-4 last:pb-0">
              <span
                className={`absolute top-5 size-3.5 rounded-full border-[3px] border-[var(--surface)] ${
                  shell === "phone" ? "-left-[24px]" : "-left-[32px]"
                } ${i === 0 ? "bg-accent" : "bg-[var(--gray-5)]"}`}
                aria-hidden="true"
              />
              {i === 0 && <p className="app-h2 mb-1 !text-accent-text">Most recent</p>}
              <RoleCard role={job} app="experience" featured={i === 0} highlight={highlight === job.id} />
            </li>
          ))}
        </ol>

        <section className="mt-8" aria-labelledby="exp-interns-toggle">
          <button
            id="exp-interns-toggle"
            type="button"
            aria-expanded={showInterns}
            aria-controls="exp-interns"
            className={`btn-secondary w-full justify-between ${touch ? "!h-11 active:scale-[.96]" : ""}`}
            onClick={(e) => {
              feedback("toggle", { el: e.currentTarget });
              setShowInterns((v) => !v);
            }}
          >
            <span className="font-semibold">Internships ({portfolio.internships.length})</span>
            <span
              className={`i-ph:caret-down-bold transition-transform duration-micro ${showInterns ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {showInterns && (
            <div id="exp-interns" className="mt-3 grid gap-3">
              {portfolio.internships.map((r) => (
                <RoleCard key={r.id} role={r} app="experience" highlight={highlight === r.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
