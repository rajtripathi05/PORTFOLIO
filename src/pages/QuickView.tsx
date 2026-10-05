import type React from "react";
import { achievementTitle, portfolio } from "~/data/portfolio";
import { coverFor, mediaFor, mediaSummary, type MediaItem } from "~/data/media";
import { previewFor } from "~/data/previews";

// Plain, scrollable, crawlable version of the portfolio. Pre-rendered to static HTML at
// build time (scripts/prerender-quick.mjs), then hydrated. Everything reads portfolio.ts.

const { identity, summary, education, experience, projects, achievements, skills, stats } = portfolio;

const statRow = [stats[0], { value: String(achievements.length), label: "awards & hackathon wins" }, ...stats.slice(1)];

// Every photo/video across achievements, for the gallery strip.
const gallery = achievements.flatMap((a) => mediaFor(a).map((item, index) => ({ a, item, index })));

const sections = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "achievements", label: "Achievements" },
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
                <li key={job.id}>
                  <h3 className="text-headline font-bold leading-snug">
                    {job.role} <span className="font-normal text-ink-3">|</span>{" "}
                    {job.orgUrl ? (
                      <a className="text-link" href={job.orgUrl} target="_blank" rel="noopener noreferrer">
                        {job.org}
                      </a>
                    ) : (
                      job.org
                    )}
                  </h3>
                  <p className="mt-0.5 text-body font-medium tabular-nums text-ink-3">
                    {job.dates}
                    {job.location && ` · ${job.location}`}
                  </p>
                  {job.tagline && <p className="mt-1.5 italic text-ink-2">{job.tagline}</p>}
                  <ul className="bullets qv-prose mt-2.5">
                    {job.bullets.map((b) => (
                      <li key={b}>
                        <RichText text={b} links={job.links} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
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
