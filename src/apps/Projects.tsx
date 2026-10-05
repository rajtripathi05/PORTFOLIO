import type React from "react";
import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";

const projects = portfolio.projects;

export default function Projects() {
  const { width, payload, nonce } = useWindow();
  const openApp = useStore((s) => s.openApp);
  const [selected, setSelected] = useState(projects[0].id);
  const articleRef = useRef<HTMLElement>(null);

  // Opening with { id } (from Spotlight, the AI assistant, etc.) selects that project.
  useEffect(() => {
    const id = payload?.id;
    if (typeof id === "string" && projects.some((p) => p.id === id)) setSelected(id);
  }, [nonce]);

  useEffect(() => {
    articleRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const narrow = width < 640;
  const index = Math.max(0, projects.findIndex((p) => p.id === selected));
  const project = projects[index];

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
              ? `whitespace-nowrap rounded-full px-3.5 py-1.5 text-footnote font-semibold ${
                  active ? "bg-accent text-on-accent" : "bg-panel border border-hairline text-ink-1"
                }`
              : `flex w-full items-start gap-2.5 rounded-button px-2.5 py-2 text-left text-body leading-snug ${
                  active ? "bg-accent text-on-accent" : "text-ink-1 hover:bg-panel-3"
                }`
          }
        >
          {!narrow && (
            <span
              className={`i-ph:folder-simple-fill mt-0.5 text-[16px] ${active ? "text-on-accent" : "text-file-folder"}`}
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
            : "w-[240px] flex-none overflow-y-auto border-r border-hairline bg-panel-2"
        }
      >
        {!narrow && <p className="app-h2 px-4 pb-2 pt-4">Projects</p>}
        <ul
          className={narrow ? "flex gap-1.5 p-2" : "space-y-0.5 px-2 pb-3"}
          onKeyDown={narrow ? undefined : onListKeyDown}
        >
          {list}
        </ul>
      </nav>

      <article ref={articleRef} className="app-scroll min-w-0 flex-1" aria-labelledby="project-title">
        <div className="max-w-[700px] px-7 py-7">
          <p className="text-footnote font-semibold text-ink-3">
            Project {index + 1} of {projects.length}
          </p>
          <h1 id="project-title" className="app-h1 mt-1">
            {project.title}
          </h1>
          {project.descriptor && <p className="mt-1.5 text-body text-ink-2">{project.descriptor}</p>}

          <div className="mt-5">
            <ProjectLinks
              project={project}
              onOpenInSafari={(url, label) => openApp("safari", { url, label })}
            />
          </div>

          <h2 className="app-h2 mt-8">Overview</h2>
          <ul className="bullets mt-2.5 text-body">
            {project.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>

          <div className="mt-9 flex justify-between gap-2 border-t border-hairline pt-4">
            <button type="button" className="btn-ghost btn-sm" onClick={() => select(index - 1)}>
              <span className="i-ph:caret-left-bold" aria-hidden="true" />
              Previous
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => select(index + 1)}>
              Next
              <span className="i-ph:caret-right-bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
