import type React from "react";
import { motion } from "framer-motion";
import { isTodoLink, mustOpenInNewTab, portfolio, safeHost, type Project } from "~/data/portfolio";
import { previewFor, previewForUrl } from "~/data/previews";
import { useAppBack, useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import { deepLinkUrl, openInNewTab } from "~/utils";
import SitePreview from "~/components/gallery/SitePreview";

const projects = portfolio.projects;

// Small per-project glyphs for the sidebar and the phone list (presentation only).
const projectIcons: Record<string, string> = {
  nsu: "i-ph:factory-fill",
  meshcraft: "i-ph:cube-fill",
  tbdos: "i-ph:lightning-fill",
  "igl-safety": "i-ph:shield-check-fill",
  acg: "i-ph:flask-fill",
  fmcg: "i-ph:chart-line-up-fill",
  financial: "i-ph:trend-up-fill"
};
const iconFor = (p: Project) => projectIcons[p.id] ?? "i-ph:folder-simple-fill";

/** The page a project's preview card opens: its main site, else its first live sub-link. */
const primaryUrl = (p: Project): string | undefined =>
  p.url && !isTodoLink(p.url) ? p.url : p.subLinks?.find((l) => !isTodoLink(l.url))?.url;

const shortTitle = (p: Project) => p.title.replace(/\s*\(.*\)$/, "");

const PreviewCard = ({ project, onOpen }: { project: Project; onOpen: (url: string, label: string) => void }) => {
  const url = primaryUrl(project);
  if (!url) return null;
  const preview = previewFor(project.id) ?? previewForUrl(url);
  const newTab = mustOpenInNewTab(url);
  return (
    <button
      type="button"
      onClick={() => {
        feedback("open");
        if (newTab) openInNewTab(url);
        else onOpen(url, project.title);
      }}
      className="group relative mt-6 block w-full max-w-[460px] overflow-hidden rounded-card border border-hairline bg-panel-2 text-left shadow-resting transition-transform duration-micro active:scale-[.98]"
      aria-label={`Open the live site for ${project.title}${newTab ? " (opens in a new tab)" : ""}`}
    >
      <span className="block aspect-[16/10] w-full overflow-hidden">
        <SitePreview
          url={url}
          preview={preview}
          className="size-full transition-transform duration-emphasis ease-standard group-hover:scale-[1.015]"
        />
      </span>
      <span className="flex items-center justify-between gap-3 border-t border-hairline bg-panel px-4 py-2.5 text-footnote">
        <span className="hstack min-w-0 gap-2 text-ink-2">
          <span className="i-ph:lock-simple-fill flex-none text-ink-3" aria-hidden="true" />
          <span className="truncate">{safeHost(url)}</span>
        </span>
        <span className="flex-none font-semibold text-accent-text">
          {newTab ? "Open in new tab ↗" : "Open live site →"}
        </span>
      </span>
    </button>
  );
};

const ProjectDetail = ({
  project,
  index,
  touch,
  onSelect,
  onOpen
}: {
  project: Project;
  index: number;
  touch: boolean;
  onSelect: (i: number) => void;
  onOpen: (url: string, label: string) => void;
}) => {
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const navBtn = `btn-ghost ${touch ? "btn-lg active:scale-[.96]" : "btn-sm"} min-w-0 max-w-[48%]`;
  return (
    <div className="max-w-[720px] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-footnote font-semibold text-ink-3 tabular">
          Project {index + 1} of {projects.length}
        </p>
        <CopyButton
          text={deepLinkUrl("projects", project.id)}
          label="Copy link"
          copiedLabel="Link to this project copied"
          className={touch ? "btn-ghost btn-lg" : "btn-ghost btn-sm"}
        />
      </div>
      <h1 id="project-title" className="app-h1 mt-1">
        {project.title}
      </h1>
      {project.descriptor && <p className="mt-1 text-callout text-ink-2">{project.descriptor}</p>}
      {project.tags?.length || project.team ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {project.team && (
            <li className="hstack gap-1 rounded-chip border border-hairline bg-panel px-2.5 py-0.5 text-footnote font-semibold text-ink-1">
              <span className="i-ph:users-three-bold text-[14px]" aria-hidden="true" />
              {project.team}
            </li>
          )}
          {project.tags?.map((t) => (
            <li key={t} className="rounded-chip bg-accent-soft px-2.5 py-0.5 text-footnote font-semibold text-accent-text">
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5">
        <ProjectLinks project={project} onOpenInSafari={onOpen} large={touch} />
      </div>

      <PreviewCard project={project} onOpen={onOpen} />

      <h2 className="app-h2 mt-8">Overview</h2>
      <ul className="bullets measure mt-2.5 text-callout leading-relaxed">
        {project.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <nav aria-label="More projects" className="mt-9 flex justify-between gap-2 border-t border-hairline pt-4">
        <button
          type="button"
          className={navBtn}
          onClick={() => onSelect(index - 1)}
          aria-label={`Previous project: ${prev.title}`}
        >
          <span className="i-ph:caret-left-bold flex-none" aria-hidden="true" />
          <span className="truncate">{shortTitle(prev)}</span>
        </button>
        <button
          type="button"
          className={navBtn}
          onClick={() => onSelect(index + 1)}
          aria-label={`Next project: ${next.title}`}
        >
          <span className="truncate">{shortTitle(next)}</span>
          <span className="i-ph:caret-right-bold flex-none" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
};

export default function Projects() {
  const { shell, width, params, nonce } = useAppHost();
  const openApp = useStore((s) => s.openApp);
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Phones and narrow windows: a list that pushes the detail. Wider: sidebar + detail.
  const compact = shell === "phone" || width < 700;
  const touch = shell !== "desktop";
  const currentId = selected ?? (compact ? null : projects[0].id);
  const index = currentId ? projects.findIndex((p) => p.id === currentId) : -1;
  const project = index >= 0 ? projects[index] : null;

  // Opening with { id } (Spotlight, the assistant, deep links…) selects that project.
  useEffect(() => {
    const id = params?.id;
    if (typeof id === "string" && projects.some((p) => p.id === id)) setSelected(id);
  }, [nonce]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentId]);

  // The shell's back button (and Android/browser back) returns to the list.
  useAppBack(compact && selected !== null, "Projects", () => setSelected(null));

  const select = (i: number) => {
    feedback("selection");
    setSelected(projects[(i + projects.length) % projects.length].id);
  };

  const openLive = (url: string, label: string) => {
    if (mustOpenInNewTab(url)) openInNewTab(url);
    else openApp("safari", { url, label });
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = index + (e.key === "ArrowDown" ? 1 : -1);
    select(next);
    const buttons = (e.currentTarget as HTMLElement).querySelectorAll("button");
    buttons[(next + projects.length) % projects.length]?.focus();
  };

  /* ------------------------------------------------------------ compact */
  if (compact) {
    if (project)
      return (
        <motion.div
          key={project.id}
          ref={scrollRef}
          className="app-scroll h-full"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        >
          <article aria-labelledby="project-title">
            {shell === "desktop" && (
              <button
                type="button"
                className="btn-ghost btn-sm ml-2 mt-3"
                onClick={() => {
                  feedback("tap");
                  setSelected(null);
                }}
              >
                <span className="i-ph:caret-left-bold" aria-hidden="true" />
                All projects
              </button>
            )}
            <ProjectDetail project={project} index={index} touch={touch} onSelect={select} onOpen={openLive} />
          </article>
        </motion.div>
      );

    return (
      <div ref={scrollRef} className="app-scroll h-full bg-panel-2">
        <div className="mx-auto max-w-[640px] px-4 py-5">
          <h1 className="app-h1 px-1">Projects</h1>
          <p className="mt-1 px-1 text-footnote text-ink-3">{projects.length} featured projects</p>
          <ul className="mt-4 overflow-hidden rounded-card bg-panel shadow-resting" aria-label="Projects">
            {projects.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    feedback("open");
                    setSelected(p.id);
                  }}
                  className="flex w-full items-center gap-3 pl-4 text-left transition-transform duration-micro active:scale-[.96]"
                >
                  <span className="grid size-9 flex-none place-items-center rounded-button bg-accent-soft" aria-hidden="true">
                    <span className={`${iconFor(p)} text-[19px] text-accent-text`} />
                  </span>
                  {/* The separator starts after the icon (inset grouped list). */}
                  <span
                    className={`flex min-h-[60px] min-w-0 flex-1 items-center gap-2 py-2.5 pr-3 ${
                      i ? "border-t border-hairline" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-ink-1">{p.title}</span>
                      {(p.descriptor || p.team) && (
                        <span className="block truncate text-footnote text-ink-3">
                          {[p.descriptor, p.team].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className="i-ph:caret-right-bold flex-none text-[14px] text-ink-3" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------- wide */
  return (
    <div className="flex h-full">
      <nav aria-label="Project list" className="w-[248px] flex-none overflow-y-auto border-r border-hairline bg-panel-2">
        <p className="app-h2 px-4 pb-2 pt-4">Featured</p>
        <ul className="space-y-0.5 px-2 pb-3" onKeyDown={onListKeyDown}>
          {projects.map((p, i) => {
            const active = p.id === currentId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => select(i)}
                  className={`flex w-full items-start gap-2.5 rounded-button px-2.5 text-left text-body leading-snug transition-colors duration-micro ${
                    touch ? "min-h-11 py-2.5 active:scale-[.96]" : "py-2"
                  } ${active ? "bg-accent text-on-accent" : "text-ink-1 hover:bg-panel-3"}`}
                >
                  <span
                    className={`${iconFor(p)} mt-0.5 flex-none text-[16px] ${active ? "text-on-accent" : "text-accent-text"}`}
                    aria-hidden="true"
                  />
                  <span>{p.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div ref={scrollRef} className="app-scroll min-w-0 flex-1">
        {project && (
          <article aria-labelledby="project-title">
            <ProjectDetail project={project} index={index} touch={touch} onSelect={select} onOpen={openLive} />
          </article>
        )}
      </div>
    </div>
  );
}
