import type React from "react";

// Tiny, safe Markdown subset for chat answers: paragraphs, bullet/numbered lists,
// **bold**, [text](url) and bare URLs. Builds React elements only (no innerHTML).

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)|https?:\/\/[^\s)]+[^\s).,;:!?])/g;

const link = (href: string, label: React.ReactNode, key: number) => (
  <a
    key={key}
    href={href}
    className="text-link"
    {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
  >
    {label}
  </a>
);

const inline = (text: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      out.push(link(m[2], label, k++));
    } else out.push(link(tok, tok.replace(/^https?:\/\//, "").replace(/\/$/, ""), k++));
    last = i + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

export default function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="list-decimal space-y-1 pl-5">
          {items}
        </ol>
      ) : (
        <ul key={blocks.length} className="list-disc space-y-1 pl-5">
          {items}
        </ul>
      )
    );
    list = null;
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.replace(/^#+\s*/, ""));
    }
  }
  flushPara();
  flushList();

  return <div className="space-y-2.5">{blocks}</div>;
}
