import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";
import type { AppId } from "~/configs/apps";

const { identity, summary, education } = portfolio;

const explore: { id: AppId; label: string; icon: string }[] = [
  { id: "projects", label: "Projects", icon: "i-ph:folder-simple-fill" },
  { id: "experience", label: "Experience", icon: "i-ph:briefcase-fill" },
  { id: "achievements", label: "Achievements", icon: "i-ph:trophy-fill" },
  { id: "skills", label: "Skills", icon: "i-ph:stack-fill" }
];

export default function AboutMe() {
  const { width } = useWindow();
  const openApp = useStore((s) => s.openApp);
  const narrow = width < 620;

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[760px] px-6 py-7 sm:px-9">
        <header className={`flex gap-6 ${narrow ? "flex-col items-center text-center" : "items-center"}`}>
          <img
            src={identity.photo}
            alt={`Photo of ${identity.name}`}
            width={128}
            height={128}
            className="size-32 flex-none rounded-full object-cover shadow-md ring-4 ring-white/70 dark:ring-white/10"
          />
          <div className="min-w-0">
            <h1 className="app-h1">{identity.name}</h1>
            <p className="mt-1.5 text-[15px] text-ink-2">{identity.headline}</p>
            <div className={`mt-4 flex flex-wrap gap-2 ${narrow ? "justify-center" : ""}`}>
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
        </header>

        <section className="mt-8" aria-labelledby="about-summary">
          <h2 id="about-summary" className="app-h2">
            Profile Summary
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-1">{summary}</p>
        </section>

        <section className="mt-7" aria-labelledby="about-education">
          <h2 id="about-education" className="app-h2">
            Education
          </h2>
          <div className="app-card mt-2 p-4">
            <p className="font-semibold">
              {education.degree} <span className="font-normal italic text-ink-2">({education.honours})</span>
            </p>
            <p className="mt-0.5 text-ink-2">{education.school}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {education.scores.map((s) => (
                <span key={s.label} className="chip">
                  <span className="mr-1.5 font-semibold">{s.label}:</span>
                  {s.value}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="about-explore">
          <h2 id="about-explore" className="app-h2">
            Explore
          </h2>
          <div className={`mt-2 grid gap-2 ${narrow ? "grid-cols-2" : "grid-cols-4"}`}>
            {explore.map((e) => (
              <button
                key={e.id}
                type="button"
                className="app-card flex items-center gap-2.5 px-3.5 py-3 text-left font-semibold hover:bg-panel-3 transition-colors"
                onClick={() => openApp(e.id)}
              >
                <span className={`${e.icon} text-[18px] text-accent-text`} aria-hidden="true" />
                {e.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
