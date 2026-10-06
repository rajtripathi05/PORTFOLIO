import type React from "react";
import type { AppId, Role } from "~/types";
import { deepLinkUrl } from "~/utils";
import { feedback } from "~/sensory/feedback";
import { useAppHost } from "~/shells/host";
import RichText from "~/components/ui/RichText";
import CopyButton from "~/components/ui/CopyButton";
import LinkButtons, { btnSize } from "./LinkButtons";

interface RoleCardProps {
  role: Role;
  /** App the card lives in; used for the "Copy link" deep link. */
  app: AppId;
  /** Briefly highlighted when the app was opened with this role's id. */
  highlight?: boolean;
  /** Emphasised card (e.g. the most recent role). */
  featured?: boolean;
  /** Extra line under the heading, e.g. the research topic. */
  subtitle?: React.ReactNode;
  /** Extra content at the end of the card. */
  children?: React.ReactNode;
}

/** DOM id of a role card, for scroll-to-item. */
export const roleDomId = (id: string): string => `role-${id}`;

/**
 * One card for every kind of role (experience, internship, research, leadership):
 * heading, dates · location, italic taglines, bullets with inline links, tag chips,
 * a highlights sub-list, link buttons and a "Copy link" deep link.
 */
export default function RoleCard({ role: r, app, highlight = false, featured = false, subtitle, children }: RoleCardProps) {
  const { shell, width } = useAppHost();
  const touch = shell !== "desktop";
  const narrow = shell === "phone" || width < 600;
  const headingId = `${roleDomId(r.id)}-title`;

  return (
    <article
      id={roleDomId(r.id)}
      aria-labelledby={headingId}
      className={`scroll-mt-4 rounded-card border p-4 transition-colors duration-emphasis ${
        highlight
          ? "border-accent bg-accent-soft"
          : featured
            ? "border-hairline bg-panel-2 shadow-resting"
            : "border-hairline bg-panel"
      }`}
    >
      <div className={`flex gap-x-4 gap-y-1 ${narrow ? "flex-col" : "items-baseline justify-between"}`}>
        <h3 id={headingId} className="text-callout font-bold leading-snug">
          {r.role}
          {r.org && (
            <>
              <span className="font-normal text-ink-3"> | </span>
              {r.orgUrl ? (
                <a
                  className="text-link font-bold"
                  href={r.orgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => feedback("open", { el: e.currentTarget })}
                >
                  {r.org}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                r.org
              )}
            </>
          )}
        </h3>
        <p className={`flex-none text-footnote font-medium tabular text-ink-3 ${narrow ? "" : "whitespace-nowrap"}`}>
          {r.dates}
          {r.location && <> · {r.location}</>}
        </p>
      </div>

      {subtitle}

      {r.taglines?.map((t) => (
        <p key={t} className="measure mt-1 italic text-ink-2">
          {t}
        </p>
      ))}

      {r.bullets.length > 0 && (
        <ul className="bullets measure mt-2.5 text-ink-1">
          {r.bullets.map((b) => (
            <li key={b}>
              <RichText text={b} links={r.inlineLinks} />
            </li>
          ))}
        </ul>
      )}

      {r.tags && r.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {r.tags.map((t) => (
            <li key={t} className="chip bg-accent-soft font-medium">
              {t}
            </li>
          ))}
        </ul>
      )}

      {r.highlights && r.highlights.items.length > 0 && (
        <div className="mt-3">
          <p className="app-h2">{r.highlights.heading}</p>
          <ul className="bullets measure mt-1.5">
            {r.highlights.items.map((h) => (
              <li key={h.name}>
                <span className="font-semibold">{h.name}</span>
                <span className="text-ink-2"> — {h.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LinkButtons links={r.links} />
        <CopyButton
          text={deepLinkUrl(app, r.id)}
          label="Copy link"
          copiedLabel="Link copied"
          className={`btn-ghost ${btnSize(touch)}`}
        />
      </div>
    </article>
  );
}
