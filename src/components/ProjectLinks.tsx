import { isTodoLink, mustOpenInNewTab, type Project } from "~/data/portfolio";

interface ProjectLinksProps {
  project: Project;
  /** When provided, shows "Open in Safari" next to "Open in new tab". */
  onOpenInSafari?: (url: string, label: string) => void;
}

const LinkRow = ({
  url,
  label,
  onOpenInSafari
}: {
  url: string;
  label: string;
  onOpenInSafari?: ProjectLinksProps["onOpenInSafari"];
}) => {
  if (isTodoLink(url)) return <ExternalLink href={url}>{label}</ExternalLink>;
  // Sites that block embedding only get the new-tab button.
  if (mustOpenInNewTab(url))
    return (
      <ExternalLink href={url} className="btn-primary">
        Open live site
      </ExternalLink>
    );
  return (
    <div className="flex flex-wrap gap-2">
      {onOpenInSafari && (
        <button type="button" className="btn-primary" onClick={() => onOpenInSafari(url, label)}>
          <span className="i-ph:compass-bold" aria-hidden="true" />
          Open in Safari
        </button>
      )}
      <ExternalLink href={url} className={onOpenInSafari ? "btn-secondary" : "btn-primary"}>
        {onOpenInSafari ? "Open in new tab" : "Open live site"}
      </ExternalLink>
    </div>
  );
};

export default function ProjectLinks({ project, onOpenInSafari }: ProjectLinksProps) {
  if (project.url)
    return <LinkRow url={project.url} label={project.title} onOpenInSafari={onOpenInSafari} />;

  if (project.subLinks?.length)
    return (
      <ul className="grid gap-2">
        {project.subLinks.map((link) => (
          <li
            key={link.label}
            className="app-card flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5"
          >
            <span className="font-semibold">{link.label}</span>
            <LinkRow
              url={link.url}
              label={`${project.title} — ${link.label}`}
              onOpenInSafari={onOpenInSafari}
            />
          </li>
        ))}
      </ul>
    );

  return <p className="text-body text-ink-3">No live link for this project.</p>;
}
