import type { InlineLink } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";

/** Renders text verbatim, turning the first occurrence of each link's text into a link. */
export default function RichText({ text, links = [] }: { text: string; links?: InlineLink[] }) {
  const match = links.find((l) => text.includes(l.text));
  if (!match) return <>{text}</>;
  const i = text.indexOf(match.text);
  return (
    <>
      {text.slice(0, i)}
      <a
        className="text-link"
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => feedback("open", { el: e.currentTarget })}
      >
        {match.text}
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <RichText text={text.slice(i + match.text.length)} links={links.filter((l) => l !== match)} />
    </>
  );
}
