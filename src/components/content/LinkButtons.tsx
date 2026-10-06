import type { NamedLink } from "~/types";
import { isTodoLink } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";
import { useAppHost } from "~/shells/host";

/** True on the phone and tablet shells: controls grow to 44px touch targets. */
export const useTouch = (): boolean => useAppHost().shell !== "desktop";

/** Small button size on the desktop, a 44px touch target on phone/tablet. */
export const btnSize = (touch: boolean): string => (touch ? "!h-11 !px-4 text-footnote active:scale-[.96]" : "btn-sm");

/**
 * Standalone link buttons from the content (e.g. "View VR project gallery ↗").
 * TODO_ placeholders are hidden; every link opens in a new tab and gets " ↗".
 */
export default function LinkButtons({ links, className = "" }: { links?: NamedLink[]; className?: string }) {
  const touch = useTouch();
  const live = (links ?? []).filter((l) => !isTodoLink(l.url));
  if (!live.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {live.map((l) => (
        <a
          key={l.url}
          className={`btn-secondary ${btnSize(touch)}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => feedback("open", { el: e.currentTarget })}
        >
          {l.label}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}
