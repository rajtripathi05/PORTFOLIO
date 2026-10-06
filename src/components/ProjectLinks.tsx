import type React from "react";
import { isTodoLink, mustOpenInNewTab, type Project } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";

interface ProjectLinksProps {
  project: Project;
  /** Opens a link inside the Safari app. Without it, "Open live site" opens a new tab. */
  onOpenInSafari?: (url: string, label: string) => void;
  /** Touch shells: 44px tap targets. */
  large?: boolean;
}

/** A link that opens in a new tab; the UI (not the data) appends " ↗". */
export const NewTabLink = ({
  href,
  children,
  className
}: {
  href: string;
  children: React.ReactNode;
  className: string;
}) => (
  <a className={className} href={href} target="_blank" rel="noopener noreferrer" onClick={() => feedback("open")}>
    {children}
    <span aria-hidden="true"> ↗</span>
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

/** Disabled "coming soon" chip for TODO_ placeholder links (the TODO text is never shown). */
export const ComingSoon = ({ large }: { large?: boolean }) => (
  <span
    className={`btn-disabled ${large ? "btn-lg" : "btn-sm"}`}
    aria-disabled="true"
    title="This link isn't live yet"
  >
    <span className="i-ph:clock-bold text-[15px]" aria-hidden="true" />
    Coming soon
  </span>
);

const LinkRow = ({
  url,
  label,
  onOpenInSafari,
  large
}: {
  url: string;
  label: string;
  onOpenInSafari?: ProjectLinksProps["onOpenInSafari"];
  large?: boolean;
}) => {
  const size = large ? "btn-lg active:scale-[.96]" : "btn-sm";
  if (isTodoLink(url)) return <ComingSoon large={large} />;
  // Sites that block embedding (and LinkedIn/GitHub/Drive) only ever open in a new tab.
  if (mustOpenInNewTab(url) || !onOpenInSafari)
    return (
      <NewTabLink href={url} className={`btn-primary ${size}`}>
        <span className="i-ph:globe-simple-bold" aria-hidden="true" />
        Open live site
      </NewTabLink>
    );
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={`btn-primary ${size}`}
        onClick={() => {
          feedback("open");
          onOpenInSafari(url, label);
        }}
      >
        <span className="i-ph:compass-bold" aria-hidden="true" />
        Open live site
      </button>
      <NewTabLink href={url} className={`btn-secondary ${size}`}>
        Open in new tab
      </NewTabLink>
    </div>
  );
};

export default function ProjectLinks({ project, onOpenInSafari, large }: ProjectLinksProps) {
  if (project.url && !isTodoLink(project.url))
    return <LinkRow url={project.url} label={project.title} onOpenInSafari={onOpenInSafari} large={large} />;

  if (project.subLinks?.length)
    return (
      <ul className="grid gap-2" aria-label="Live sites">
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
              large={large}
            />
          </li>
        ))}
      </ul>
    );

  return <p className="text-body text-ink-3">No live link for this project.</p>;
}
