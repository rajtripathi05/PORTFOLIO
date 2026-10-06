import type React from "react";
import { achievementTitle, portfolio } from "~/data/portfolio";
import { coverFor, mediaFor, mediaSummary, type MediaItem } from "~/data/media";
import { previewFor } from "~/data/previews";
import { isTodoLink } from "~/data/portfolio";
import type { Role } from "~/types";
import OfflineNotice from "~/shells/shared/OfflineNotice";
import { downloadVCard } from "~/features/vcard";
import { share } from "~/features/share";

// Plain, scrollable, crawlable version of the portfolio. Pre-rendered to static HTML at
// build time (scripts/prerender-quick.mjs), then hydrated. Everything reads portfolio.ts.

const { identity, summary, education, experience, internships, research, copyrights, leadership, projects, achievements, certifications, skills, stats } = portfolio;

const statRow = [stats[0], { value: String(achievements.length), label: "awards & hackathon wins" }, ...stats.slice(1)];

// Every photo/video across achievements, for the gallery strip.
const gallery = achievements.flatMap((a) => mediaFor(a).map((item, index) => ({ a, item, index })));

// Certifications grouped by issuer, in data order.
const certGroups = certifications.reduce<{ issuer: string; items: typeof certifications }[]>((acc, c) => {
  const g = acc.find((x) => x.issuer === c.issuer);
  if (g) g.items.push(c);
  else acc.push({ issuer: c.issuer, items: [c] });
  return acc;
}, []);

const sections = [
  { id: "experience", label: "Experience" },
  { id: "research", label: "Research & IP" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
  { id: "leadership", label: "Leadership" },
  { id: "certifications", label: "Certifications" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" }
];

const Section = ({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} aria-labelledby={`${id}-title`} className="qv-section reveal">
    <h2 id={`${id}-title`} className="qv-h2">
      {title}
    </h2>
    {children}
  </section>
);

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className="text-link" href={href} target="_blank" rel="noopener noreferrer">
    {children}
    <span aria-hidden="true"> ↗</span>
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

/** One role: the same shape serves experience, internships, research and leadership. */
const QvRole = ({ r, subtitle }: { r: Role; subtitle?: string }) => (
  <li>
    <h3 className="text-headline font-bold leading-snug">
      {r.role}
      {r.org && (
        <>
          {" "}
          <span className="font-normal text-ink-3">|</span> {r.orgUrl ? <Ext href={r.orgUrl}>{r.org}</Ext> : r.org}
        </>
      )}
    </h3>
    <p className="mt-0.5 text-body font-medium tabular-nums text-ink-3">
      {r.dates}
      {r.location && ` · ${r.location}`}
    </p>
    {subtitle && <p className="mt-1 italic text-ink-2">{subtitle}</p>}
    {r.taglines?.map((t) => (
      <p key={t} className="mt-1.5 italic text-ink-2">
        {t}
      </p>
    ))}
    <ul className="bullets qv-prose mt-2.5">
      {r.bullets.map((b) => (
        <li key={b}>
          <RichText text={b} links={r.inlineLinks} />
        </li>
      ))}
    </ul>
    {r.highlights && (
      <div className="mt-3">
        <p className="font-semibold">{r.highlights.heading}</p>
        <ul className="bullets qv-prose mt-1.5">
          {r.highlights.items.map((i) => (
            <li key={i.name}>
              <strong>{i.name}:</strong> {i.description}
            </li>
          ))}
        </ul>
      </div>
    )}
    {r.tags?.length ? (
      <p className="mt-2.5 flex flex-wrap gap-1.5">
        {r.tags.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </p>
    ) : null}
    {r.links?.some((l) => !isTodoLink(l.url)) && (
      <p className="qv-actions mt-3 flex flex-wrap gap-2">
        {r.links
          .filter((l) => !isTodoLink(l.url))
          .map((l) => (
            <a key={l.url} className="btn-secondary btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
              <span aria-hidden="true"> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
      </p>
    )}
  </li>
);

export default function QuickView() {
  const toggleDark = useStore((s) => s.toggleDark);
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [viewer, setViewer] = useState<{ title: string; items: MediaItem[]; index: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);

  // Highlight the section currently being read in the header nav.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
    document.body.style.overflow = "auto";
    document.title = "Raj Tripathi — Quick View";

    // Fade sections up once as they enter (content stays visible without JS or with reduced motion).
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window))
      return;
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="qv">
      <a
        href="#main"
        className="sr-only z-50 rounded-button bg-accent px-4 py-2 font-semibold text-on-media focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="qv-header material-menubar">
        <div className="qv-wrap flex h-14 items-center gap-4">
          <a href="#top" className="hstack gap-2 font-bold text-ink-1">
            <Monogram size={20} />
            <span>{identity.name}</span>
          </a>
          <nav aria-label="Sections" className="qv-nav ml-auto hidden md:flex">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}>
                {s.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:ml-2">
            {mounted && (
              <button
                type="button"
                className="grid size-9 place-items-center rounded-button text-ink-2 hover:bg-panel-3"
                onClick={() => {
                  toggleDark();
                  setDark((d) => !d);
                }}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className={dark ? "i-ph:sun-bold" : "i-ph:moon-bold"} />
              </button>
            )}
            <a className="btn-secondary btn-sm" href="/">
              <span className="i-ph:desktop-bold" aria-hidden="true" />
              Desktop view
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <div id="top" className="qv-wrap qv-hero">
          <img
            src={identity.photo}
            alt={`Photo of ${identity.name}`}
            width={132}
            height={132}
            className="size-[132px] flex-none rounded-full object-cover shadow-raised ring-4 ring-[var(--photo-ring)]"
          />
          <div>
            <h1 className="qv-h1">{identity.name}</h1>
            <p className="mt-2 text-callout text-ink-2">{identity.headline}</p>
            <div className="qv-actions mt-5 flex flex-wrap gap-2">
              <a className="btn-primary" href={identity.resumePdf} download="Raj_Tripathi_Resume.pdf">
                <span className="i-ph:download-simple-bold" aria-hidden="true" />
                Download Resume
              </a>
              <a className="btn-secondary" href={`mailto:${identity.email}`}>
                <span className="i-ph:envelope-simple-bold" aria-hidden="true" />
                Email
              </a>
              <ExternalLink href={identity.linkedin}>
                <span className="i-ph:linkedin-logo-bold" aria-hidden="true" />
                LinkedIn
              </ExternalLink>
              <ExternalLink href={identity.github}>
                <span className="i-ph:github-logo-bold" aria-hidden="true" />
                GitHub
              </ExternalLink>
              <a className="btn-secondary" href={`tel:${identity.phone.replace(/\s+/g, "")}`}>
                <span className="i-ph:phone-bold" aria-hidden="true" />
                Call
              </a>
              {mounted && (
                <>
                  <button type="button" className="btn-secondary" onClick={downloadVCard}>
                    <span className="i-ph:address-book-bold" aria-hidden="true" />
                    Save contact
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      void share({ title: `${identity.name} — Portfolio`, url: window.location.origin + "/quick" })
                    }
                  >
                    <span className="i-ph:share-network-bold" aria-hidden="true" />
                    Share
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="qv-wrap">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Highlights in numbers">
            {statRow.map((s) => (
              <li key={s.label} className="qv-card !p-4">
                <p className="text-title font-bold tabular text-accent-text">{s.value}</p>
                <p className="mt-0.5 text-footnote leading-snug text-ink-2">{s.label}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="qv-wrap">
          <Section id="summary" title="Profile Summary">
            <p className="qv-prose">{summary}</p>
            <div className="qv-card mt-5">
              <h3 className="font-bold">
                {education.degree} <span className="font-normal italic text-ink-2">({education.honours})</span>
              </h3>
              <p className="mt-1 text-ink-2">{education.school}</p>
              <p className="mt-2 tabular-nums text-ink-2">
                {education.scores.map((s, i) => (
                  <span key={s.label}>
                    {i > 0 && " · "}
                    <strong className="text-ink-1">{s.label}:</strong> {s.value}
                  </span>
                ))}
              </p>
            </div>
          </Section>

          <Section id="experience" title="Experience">
            <ol className="qv-timeline">
              {experience.map((job) => (
                <QvRole key={job.id} r={job} />
              ))}
            </ol>
            {internships.length > 0 && (
              <>
                <h3 className="qv-h3 mt-8">Internships</h3>
                <ol className="qv-timeline mt-4">
                  {internships.map((job) => (
                    <QvRole key={job.id} r={job} />
                  ))}
                </ol>
              </>
            )}
          </Section>

          <Section id="research" title="Research & IP">
            <ol className="qv-timeline">
              {research.map((r) => (
                <QvRole key={r.id} r={r} subtitle={r.topic} />
              ))}
            </ol>
            {research
              .filter((r) => !isTodoLink(r.paperUrl))
              .map((r) => (
                <p key={r.id} className="mt-3">
                  <Ext href={r.paperUrl}>{isTodoLink(r.paperTitle) ? "Read the paper" : r.paperTitle}</Ext>
                  {!isTodoLink(r.venue) && <span className="text-ink-2"> · {r.venue}</span>}
                </p>
              ))}
            <div className="mt-6 grid gap-4">
              {copyrights.map((c) => (
                <article key={c.id} className="qv-card qv-project has-preview" aria-labelledby={`qv-${c.id}`}>
                  <img
                    className="qv-media qv-project-preview"
                    src={c.certificateThumb}
                    alt={`First page of the copyright certificate for “${c.title}”`}
                    width={480}
                    height={300}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0">
                    <p className="text-footnote font-semibold uppercase tracking-wide text-ink-3">Copyright · {c.office}</p>
                    <h3 id={`qv-${c.id}`} className="mt-1 text-headline font-bold leading-snug">
                      {c.title}
                    </h3>
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-body text-ink-2 sm:grid-cols-[auto_1fr]">
                      <dt className="font-semibold text-ink-1">Class of work</dt>
                      <dd>{c.workClass}</dd>
                      <dt className="font-semibold text-ink-1">Registration no.</dt>
                      <dd className="tabular-nums">{c.regNo}</dd>
                      <dt className="font-semibold text-ink-1">Dated</dt>
                      <dd>{c.dated}</dd>
                      <dt className="font-semibold text-ink-1">Role</dt>
                      <dd>{c.role}</dd>
                    </dl>
                    <p className="qv-actions mt-3">
                      <a className="btn-secondary btn-sm" href={c.certificatePdf} target="_blank" rel="noopener noreferrer">
                        View certificate (PDF)
                        <span aria-hidden="true"> ↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="projects" title="Projects">
            <div className="grid gap-4">
              {projects.map((pr) => (
                <article
                  key={pr.id}
                  className={`qv-card qv-project ${previewFor(pr.id) ? "has-preview" : ""}`}
                  aria-labelledby={`qv-${pr.id}`}
                >
                  {previewFor(pr.id) && (
                    <img
                      className="qv-media qv-project-preview"
                      src={previewFor(pr.id)!.srcSm}
                      srcSet={`${previewFor(pr.id)!.srcSm} 480w, ${previewFor(pr.id)!.src} 960w`}
                      sizes="(max-width: 700px) 100vw, 300px"
                      alt={`Screenshot of the ${pr.title} live site`}
                      width={480}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      style={{ backgroundColor: previewFor(pr.id)!.color }}
                    />
                  )}
                  <div className="min-w-0">
                  <h3 id={`qv-${pr.id}`} className="text-headline font-bold leading-snug">
                    {pr.title}
                  </h3>
                  {pr.descriptor && <p className="mt-0.5 text-ink-2">{pr.descriptor}</p>}
                  {pr.tags?.length ? (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {pr.tags.map((t) => (
                        <span key={t} className="rounded-chip bg-accent-soft px-2.5 py-0.5 text-footnote font-semibold text-accent-text">
                          {t}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <ul className="bullets qv-prose mt-3">
                    {pr.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <div className="qv-actions mt-4">
                    <ProjectLinks project={pr} />
                  </div>
                  {pr.url && <p className="qv-print-url">{pr.url}</p>}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="achievements" title="Achievements">
            <ul className="qv-media qv-strip" aria-label="Photos and videos from the achievements">
              {gallery.map(({ a, item, index }) => (
                <li key={item.src}>
                  <button
                    type="button"
                    className="relative block h-32 overflow-hidden rounded-card"
                    style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : "4 / 3" }}
                    onClick={() => setViewer({ title: a.name, items: mediaFor(a), index })}
                    aria-label={`${a.name}: ${item.type === "video" ? "play video" : "view photo"} ${item.name}`}
                  >
                    <LazyImage src={(item.thumb ?? item.poster)!} alt="" color={item.color} blur={item.blur} className="size-full" />
                    {item.type === "video" && (
                      <span className="absolute inset-0 m-auto grid size-10 place-items-center rounded-full bg-media-chip text-on-media">
                        <span className="i-ph:play-fill ml-0.5 text-[18px]" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {achievements.map((a) => {
                const items = mediaFor(a);
                const cover = coverFor(items);
                return (
                  <article key={a.id} className="qv-card flex flex-col gap-2.5 !p-0 overflow-hidden" aria-labelledby={`qv-${a.id}`}>
                    {cover && (
                      <button
                        type="button"
                        className="qv-media relative block aspect-[16/9] w-full overflow-hidden"
                        onClick={() => setViewer({ title: a.name, items, index: 0 })}
                        aria-label={`View photos for ${a.name} (${mediaSummary(items)})`}
                      >
                        <LazyImage src={(cover.thumb ?? cover.poster)!} alt="" color={cover.color} blur={cover.blur} className="size-full" />
                        <span className="absolute bottom-2 right-2 rounded-full bg-media-chip px-2.5 py-1 text-footnote font-semibold text-on-media">
                          {mediaSummary(items)}
                        </span>
                      </button>
                    )}
                    <div className="flex flex-col gap-2 px-5 pb-5 pt-2">
                      <h3 id={`qv-${a.id}`} className="text-callout font-bold leading-snug">
                        {achievementTitle(a)}
                      </h3>
                      <AchievementBadges a={a} />
                      <p className="text-body leading-relaxed text-ink-2">{a.description}</p>
                      {a.links?.map((l) => (
                        <ExternalLink key={l.url} href={l.url} className="text-link w-max font-semibold">
                          {l.label}
                        </ExternalLink>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="qv-actions mt-4">
              <ExternalLink href={portfolio.driveArchiveUrl} className="text-link font-semibold">
                View full archive on Google Drive
              </ExternalLink>
            </p>
          </Section>

          <Section id="leadership" title="Leadership">
            <ol className="qv-timeline">
              {leadership.map((r) => (
                <QvRole key={r.id} r={r} />
              ))}
            </ol>
          </Section>

          <Section id="certifications" title="Certifications">
            <p className="qv-prose mb-4 text-ink-2">{portfolio.certificationsSummary}</p>
            <div className="grid gap-4">
              {certGroups.map((g) => (
                <div key={g.issuer} className="qv-card">
                  <h3 className="font-bold">{g.issuer}</h3>
                  <ul className="mt-2.5 grid gap-2">
                    {g.items.map((c) => (
                      <li key={c.id} className="text-body">
                        <span className="font-semibold">{c.course}</span>
                        <span className="text-ink-3"> · {c.issued}</span> <Ext href={c.verifyUrl}>Verify</Ext>
                        <span className="qv-print-url">{c.verifyUrl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section id="skills" title="Technical Skills">
            <dl className="grid gap-4 sm:grid-cols-2">
              {skills.map((g) => (
                <div key={g.name} className="qv-card">
                  <dt className="font-bold">{g.name}</dt>
                  <dd className="mt-2.5 flex flex-wrap gap-1.5">
                    {g.items.map((i) => (
                      <span key={i} className="chip">
                        {i}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="contact" title="Contact">
            <ul className="qv-card grid gap-3 text-callout sm:grid-cols-2">
              <li>
                <span className="block text-footnote font-semibold uppercase tracking-wide text-ink-3">Email</span>
                <a className="text-link" href={`mailto:${identity.email}`}>
                  {identity.email}
                </a>
              </li>
              <li>
                <span className="block text-footnote font-semibold uppercase tracking-wide text-ink-3">Phone</span>
                <a className="text-link tabular-nums" href={`tel:${identity.phone.replace(/\s+/g, "")}`}>
                  {identity.phone}
                </a>
              </li>
              <li>
                <span className="block text-footnote font-semibold uppercase tracking-wide text-ink-3">LinkedIn</span>
                <a className="text-link" href={identity.linkedin} target="_blank" rel="noopener noreferrer">
                  {identity.linkedin.replace("https://", "")}
                </a>
              </li>
              <li>
                <span className="block text-footnote font-semibold uppercase tracking-wide text-ink-3">GitHub</span>
                <a className="text-link" href={identity.github} target="_blank" rel="noopener noreferrer">
                  {identity.github.replace("https://", "")}
                </a>
              </li>
            </ul>
          </Section>
        </div>
      </main>

      <footer className="qv-wrap qv-footer">
        <p>
          © {identity.name}.{" "}
          <a className="text-link" href="/">
            Open the desktop version
          </a>
        </p>
      </footer>

      <OfflineNotice />

      {viewer && (
        <Lightbox
          title={viewer.title}
          items={viewer.items}
          index={viewer.index}
          onIndex={(index) => setViewer((v) => v && { ...v, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
