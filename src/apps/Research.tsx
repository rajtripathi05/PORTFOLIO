import { isTodoLink, portfolio, type Copyright } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import RoleCard, { roleDomId } from "~/components/content/RoleCard";
import SectionHeading from "~/components/content/SectionHeading";
import { useScrollTarget } from "~/components/content/useScrollTarget";

function CopyrightCard({ c, highlight }: { c: Copyright; highlight: boolean }) {
  const { shell, width } = useAppHost();
  const touch = shell !== "desktop";
  const narrow = shell === "phone" || width < 560;
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <article
      id={roleDomId(c.id)}
      aria-labelledby={`${c.id}-title`}
      className={`scroll-mt-4 rounded-card border p-4 transition-colors duration-emphasis ${
        highlight ? "border-accent bg-accent-soft" : "border-hairline bg-panel-2 shadow-resting"
      }`}
    >
      <div className={`flex gap-4 ${narrow ? "flex-col" : "items-start"}`}>
        <div
          className={`flex-none overflow-hidden rounded-card border border-hairline bg-panel ${
            narrow ? "mx-auto w-[180px]" : "w-[140px]"
          }`}
        >
          {thumbFailed ? (
            <div className="grid aspect-[3/4] place-items-center text-ink-3">
              <span className="i-ph:file-text text-[48px]" aria-hidden="true" />
              <span className="sr-only">Certificate document</span>
            </div>
          ) : (
            <img
              src={c.certificateThumb}
              alt={`First page of the copyright certificate for “${c.title}”`}
              loading="lazy"
              className="block aspect-[3/4] w-full object-cover object-top"
              onError={() => setThumbFailed(true)}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 id={`${c.id}-title`} className="text-callout font-bold leading-snug">
            {c.title}
          </h3>
          <p className="mt-1 text-ink-2">{c.office}</p>
          <p className="mt-1 text-footnote text-ink-2">{c.workClass}</p>
          <p className="mt-2 text-footnote font-medium tabular text-ink-1">
            Reg. No. {c.regNo} · Dated {c.dated} · Diary No. {c.diaryNo}
          </p>
          <p className="mt-2 text-footnote text-ink-2">
            <span className="font-semibold text-ink-1">Applicant:</span> {c.applicant}
          </p>
          <p className="mt-2">
            <span className="chip bg-accent-soft font-semibold">{c.role}</span>
            <span className="ml-2 text-footnote text-ink-2">· {c.coAuthors}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className={`btn-secondary ${touch ? "!h-11 active:scale-[.96]" : "btn-sm"}`}
              href={c.certificatePdf}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => feedback("open", { el: e.currentTarget })}
            >
              <span className="i-ph:seal-check-bold" aria-hidden="true" />
              View certificate
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Research() {
  const { shell } = useAppHost();
  const rootRef = useRef<HTMLDivElement>(null);
  const highlight = useScrollTarget(rootRef, roleDomId);

  return (
    <div ref={rootRef} className="app-scroll">
      <div className={`mx-auto max-w-[800px] py-7 ${shell === "phone" ? "px-4" : "px-6 sm:px-9"}`}>
        <h1 className="app-h1">Research & IP</h1>

        <section className="mt-6" aria-labelledby="research-heading">
          <SectionHeading id="research-heading" className="mb-2">
            Research
          </SectionHeading>
          <div className="grid gap-4">
            {portfolio.research.map((r) => {
              const paper = [r.paperTitle, r.venue].filter((v) => !isTodoLink(v));
              return (
                <RoleCard
                  key={r.id}
                  role={r}
                  app="research"
                  highlight={highlight === r.id}
                  subtitle={<p className="measure mt-1 italic text-ink-2">{r.topic}</p>}
                >
                  {paper.length > 0 && (
                    <p className="mt-3 text-footnote text-ink-2">
                      <span className="font-semibold text-ink-1">Paper:</span> {paper.join(" — ")}
                    </p>
                  )}
                  {!isTodoLink(r.paperUrl) && (
                    <a
                      className="btn-secondary btn-sm mt-2"
                      href={r.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => feedback("open", { el: e.currentTarget })}
                    >
                      Read the paper
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </RoleCard>
              );
            })}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="copyright-heading">
          <SectionHeading id="copyright-heading" className="mb-2">
            Copyright
          </SectionHeading>
          <div className="grid gap-4">
            {portfolio.copyrights.map((c) => (
              <CopyrightCard key={c.id} c={c} highlight={highlight === c.id} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
