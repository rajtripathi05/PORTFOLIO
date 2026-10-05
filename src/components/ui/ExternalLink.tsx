import type React from "react";
import { isTodoLink } from "~/data/portfolio";

interface ExternalLinkProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  /** Shown instead of the link while the URL is still a TODO_ placeholder. */
  todoLabel?: string;
}

/** Opens in a new tab; TODO_ placeholders render as a disabled "Link coming soon". */
export default function ExternalLink({
  href,
  children,
  className = "btn-secondary",
  todoLabel = "Link coming soon"
}: ExternalLinkProps) {
  if (isTodoLink(href)) {
    return (
      <span className="btn-disabled btn-sm" aria-disabled="true" title="This link isn't live yet">
        <span className="i-ph:clock text-[15px]" aria-hidden="true" />
        {todoLabel}
      </span>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
