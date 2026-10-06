import type React from "react";
import { mustOpenInNewTab, portfolio, type Project } from "~/data/portfolio";
import { previewFor } from "~/data/previews";
import { useAppHost } from "~/shells/host";
import { deepLinkUrl, openInNewTab } from "~/utils";

const projects = portfolio.projects;

// Small per-project glyphs for the Finder-style sidebar (presentation only).
const projectIcons: Record<string, string> = {
  nsu: "i-ph:factory-fill",
  tbdos: "i-ph:lightning-fill",
  "igl-safety": "i-ph:shield-check-fill",
  acg: "i-ph:flask-fill",
  fmcg: "i-ph:chart-line-up-fill",
  financial: "i-ph:trend-up-fill"
};

const PreviewCard = ({ project, onOpen }: { project: Project; onOpen: (url: string) => void }) => {
  const preview = previewFor(project.id);
  if (!preview) return null;
  const newTab = mustOpenInNewTab(preview.url);
  return (
    <button
      type="button"
      onClick={() => (newTab ? openInNewTab(preview.url) : onOpen(preview.url))}
      className="group relative mt-6 block w-full max-w-[460px] overflow-hidden rounded-card border border-hairline bg-panel-2 text-left shadow-resting"
      aria-label={`Open the live site for ${project.title}${newTab ? " (opens in a new tab)" : ""}`}
    >
      <span className="block aspect-[16/10] w-full overflow-hidden">
        <img
          src={preview.src}
          srcSet={`${preview.srcSm} 480w, ${preview.src} 960w`}
          sizes="(max-width: 700px) 100vw, 460px"
          alt=""
          width={preview.width}
          height={preview.height}
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-top transition-transform duration-emphasis ease-standard group-hover:scale-[1.015]"
          style={{ backgroundColor: preview.color }}
        />
      </span>
      <span className="flex items-center justify-between gap-3 border-t border-hairline bg-panel px-4 py-2.5 text-footnote">
        <span className="hstack min-w-0 gap-2 text-ink-2">
          <span className="i-ph:globe-simple-bold flex-none" aria-hidden="true" />
          <span className="truncate">{new URL(preview.url).hostname}</span>
        </span>
        <span className="flex-none font-semibold text-accent-text">
          {newTab ? "Open in new tab ↗" : "Open live site →"}
        </span>
      </span>
    </button>
  );
};

export default function Projects() {
  const { width, params, nonce } = useAppHost();
  const openApp = useStore((s) => s.openApp);
  const [selected, setSelected] = useState(projects[0].id);
  const articleRef = useRef<HTMLElement>(null);

  // Opening with { id } (from Spotlight, the AI assistant, deep links…) selects that project.
  useEffect(() => {
    const id = params?.id;
    if (typeof id === "string" && projects.some((p) => p.id === id)) setSelected(id);
  }, [nonce]);

  useEffect(() => {
    articleRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const narrow = width < 640;
  const index = Math.max(0, projects.findIndex((p) => p.id === selected));
  const project = projects[index];
  const openInSafari = (url: string) => openApp("safari", { url, label: project.title });

  const select = (i: number) => setSelected(projects[(i + projects.length) % projects.length].id);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = index + (e.key === "ArrowDown" ? 1 : -1);
    select(next);
    const buttons = (e.currentTarget as HTMLElement).querySelectorAll("button");
    buttons[(next + projects.length) % projects.length]?.focus();
  };

  const list = projects.map((p, i) => {
    const active = p.id === selected;
    return (
      <li key={p.id}>
        <button
          type="button"
          aria-current={active ? "true" : undefined}
          onClick={() => select(i)}
          className={
            narrow
              ? `pressable whitespace-nowrap rounded-chip px-3.5 py-1.5 text-footnote font-semibold ${
                  active ? "bg-accent text-on-accent" : "border border-hairline bg-panel text-ink-1"
                }`
              : `flex w-full items-start gap-2.5 rounded-button px-2.5 py-2 text-left text-body leading-snug transition-colors duration-micro ${
                  active ? "bg-accent text-on-accent" : "text-ink-1 hover:bg-panel-3"
                }`
          }
        >
          {!narrow && (
            <span
              className={`${projectIcons[p.id] ?? "i-ph:folder-simple-fill"} mt-0.5 text-[16px] ${
                active ? "text-on-accent" : "text-accent-text"
              }`}
              aria-hidden="true"
            />
          )}
          <span>{p.title}</span>
        </button>
      </li>
    );
  });

  return (
    <div className={`flex h-full ${narrow ? "flex-col" : ""}`}>
      <nav
        aria-label="Project list"
        className={
          narrow
            ? "flex-none overflow-x-auto border-b border-hairline bg-panel-2"
            : "w-[248px] flex-none overflow-y-auto border-r border-hairline bg-panel-2"
        }
      >
        {!narrow && <p className="app-h2 px-4 pb-2 pt-4">Featured</p>}
        <ul className={narrow ? "flex gap-1.5 p-2" : "space-y-0.5 px-2 pb-3"} onKeyDown={narrow ? undefined : onListKeyDown}>
          {list}
        </ul>
      </nav>

      <article ref={articleRef} className="app-scroll min-w-0 flex-1" aria-labelledby="project-title">
        <div className="max-w-[720px] px-7 py-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-footnote font-semibold text-ink-3">
              Project {index + 1} of {projects.length}
            </p>
            <CopyButton
              text={deepLinkUrl("projects", project.id)}
              label="Copy link"
              copiedLabel="Link to this project copied"
              className="btn-ghost btn-sm"
            />
          </div>
          <h1 id="project-title" className="app-h1 mt-1">
            {project.title}
          </h1>
          {project.descriptor && <p className="mt-1 text-callout text-ink-2">{project.descriptor}</p>}
          {project.tags?.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
              {project.tags.map((t) => (
                <li key={t} className="rounded-chip bg-accent-soft px-2.5 py-0.5 text-footnote font-semibold text-accent-text">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5">
            <ProjectLinks project={project} onOpenInSafari={openInSafari} />
          </div>

          <PreviewCard project={project} onOpen={openInSafari} />

          <h2 className="app-h2 mt-8">Overview</h2>
          <ul className="bullets measure mt-2.5 text-callout leading-relaxed">
            {project.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="mt-9 flex justify-between gap-2 border-t border-hairline pt-4">
            <button type="button" className="btn-ghost btn-sm min-w-0 max-w-[48%]" onClick={() => select(index - 1)}>
              <span className="i-ph:caret-left-bold" aria-hidden="true" />
              <span className="truncate">
                {projects[(index - 1 + projects.length) % projects.length].title.replace(/\s*\(.*\)$/, "")}
              </span>
            </button>
            <button type="button" className="btn-ghost btn-sm min-w-0 max-w-[48%]" onClick={() => select(index + 1)}>
              <span className="truncate">
                {projects[(index + 1) % projects.length].title.replace(/\s*\(.*\)$/, "")}
              </span>
              <span className="i-ph:caret-right-bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
