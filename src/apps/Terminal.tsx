import type React from "react";
import { achievementTitle, isTodoLink, portfolio } from "~/data/portfolio";
import { MAX_USER_CHARS } from "~/data/assistant";
import { askAssistant } from "~/features/ai/askAssistant";
import { feedback } from "~/sensory/feedback";
import type { Role } from "~/types";

const p = portfolio;
const PROMPT = "raj@portfolio ~ %";

const COMMANDS: Record<string, string> = {
  help: "List available commands",
  about: "Who Raj is",
  experience: "Work experience",
  projects: "Projects and live links",
  skills: "Technical skills",
  achievements: "Awards and hackathon wins",
  research: "Research and copyright",
  leadership: "Leadership and community roles",
  certifications: "Courses and verified certificates",
  contact: "How to get in touch",
  resume: "Open the resume PDF",
  clear: "Clear the screen",
  ai: "Ask the AI assistant, e.g. ai What has he won?"
};

const C = {
  head: "term-head",
  key: "term-key",
  dim: "term-dim",
  ok: "term-ok",
  link: "term-link",
  err: "term-err"
};

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className={C.link} href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const roleList = (roles: Role[], topic?: (r: Role) => string | undefined) => (
  <div className="space-y-2">
    {roles.map((e) => (
      <div key={e.id}>
        <p>
          <span className={C.head}>{e.role}</span>
          {e.org && <> | {e.org}</>} <span className={C.dim}>({e.dates})</span>
        </p>
        {topic?.(e) && <p className={C.dim}>{topic(e)}</p>}
        {e.bullets.map((b) => (
          <p key={b} className="pl-3">
            <span className={C.ok}>•</span> {b}
          </p>
        ))}
      </div>
    ))}
  </div>
);

const outputs: Record<string, () => React.ReactNode> = {
  research: () => (
    <div className="space-y-3">
      {roleList(p.research, (r) => (r as (typeof p.research)[number]).topic)}
      {p.copyrights.map((c) => (
        <p key={c.id}>
          <span className={C.head}>Copyright:</span> {c.title} <span className={C.dim}>({c.regNo}, {c.dated}, {c.role})</span>{" "}
          <A href={c.certificatePdf}>certificate</A>
        </p>
      ))}
    </div>
  ),
  leadership: () => roleList(p.leadership),
  certifications: () => (
    <div className="space-y-1">
      <p className={C.dim}>{p.certificationsSummary}</p>
      {p.certifications.map((c) => (
        <p key={c.id}>
          <span className={C.head}>{c.course}</span> <span className={C.dim}>— {c.issuer}, {c.issued}</span>{" "}
          <A href={c.verifyUrl}>verify</A>
        </p>
      ))}
    </div>
  ),
  help: () => (
    <div>
      <p>Available commands:</p>
      <ul className="mt-1">
        {Object.entries(COMMANDS).map(([c, d]) => (
          <li key={c}>
            <span className={`${C.key} inline-block w-32`}>{c}</span>
            <span className={C.dim}>{d}</span>
          </li>
        ))}
      </ul>
      <p className={`${C.dim} mt-1`}>Tip: Tab completes a command, ↑/↓ browse history.</p>
    </div>
  ),
  about: () => (
    <div>
      <p className={C.head}>{p.identity.name}</p>
      <p className={C.dim}>{p.identity.headline}</p>
      <p className="mt-1">{p.summary}</p>
      <p className="mt-1">
        <span className={C.key}>Education:</span> {p.education.degree} ({p.education.honours}),{" "}
        {p.education.school} — {p.education.scores.map((s) => `${s.label} ${s.value}`).join(" · ")}
      </p>
    </div>
  ),
  experience: () => (
    <div className="space-y-2">
      {p.experience.map((e) => (
        <div key={e.id}>
          <p>
            <span className={C.head}>{e.role}</span> | {e.org}{" "}
            <span className={C.dim}>
              ({e.dates}
              {e.location ? `, ${e.location}` : ""})
            </span>
          </p>
          {e.taglines?.map((t) => (
            <p key={t} className={C.dim}>
              {t}
            </p>
          ))}
          {e.bullets.map((b) => (
            <p key={b} className="pl-3">
              <span className={C.ok}>•</span> {b}
            </p>
          ))}
        </div>
      ))}
    </div>
  ),
  projects: () => (
    <div className="space-y-2">
      {p.projects.map((pr) => (
        <div key={pr.id}>
          <p>
            <span className={C.head}>{pr.title}</span>
            {pr.descriptor && <span className={C.dim}> — {pr.descriptor}</span>}
          </p>
          {pr.url && (
            <p className="pl-3">
              <A href={pr.url}>{pr.url}</A>
            </p>
          )}
          {pr.subLinks?.map((l) => (
            <p key={l.label} className="pl-3">
              <span className={C.key}>{l.label}:</span>{" "}
              {isTodoLink(l.url) ? <span className={C.dim}>link coming soon</span> : <A href={l.url}>{l.url}</A>}
            </p>
          ))}
          {pr.bullets.map((b) => (
            <p key={b} className="pl-3">
              <span className={C.ok}>•</span> {b}
            </p>
          ))}
        </div>
      ))}
    </div>
  ),
  skills: () => (
    <div>
      {p.skills.map((s) => (
        <p key={s.name}>
          <span className={`${C.key} inline-block w-44`}>{s.name}</span>
          {s.items.join(", ")}
        </p>
      ))}
    </div>
  ),
  achievements: () => (
    <div className="space-y-1">
      {p.achievements.map((a) => (
        <p key={a.id}>
          <span className={C.head}>{achievementTitle(a)}</span>
          {a.prize && <span className={C.ok}> {a.prize}</span>}
          <span className={C.dim}> ({a.teamSize})</span> — {a.description}
        </p>
      ))}
      <p>
        <span className={C.dim}>Photos & certificates:</span> <A href={p.driveArchiveUrl}>Google Drive archive</A>
      </p>
    </div>
  ),
  contact: () => (
    <div>
      <p>
        <span className={`${C.key} inline-block w-24`}>Email</span>
        <a className={C.link} href={`mailto:${p.identity.email}`}>
          {p.identity.email}
        </a>
      </p>
      <p>
        <span className={`${C.key} inline-block w-24`}>Phone</span>
        {p.identity.phone}
      </p>
      <p>
        <span className={`${C.key} inline-block w-24`}>LinkedIn</span>
        <A href={p.identity.linkedin}>{p.identity.linkedin}</A>
      </p>
      <p>
        <span className={`${C.key} inline-block w-24`}>GitHub</span>
        <A href={p.identity.github}>{p.identity.github}</A>
      </p>
    </div>
  )
};

interface Entry {
  id: number;
  cmd?: string;
  out: React.ReactNode;
}

let seq = 0;

export default function Terminal() {
  const openApp = useStore((s) => s.openApp);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = (cmd: string | undefined, out: React.ReactNode) =>
    setEntries((e) => [...e, { id: ++seq, cmd, out }]);

  useEffect(() => {
    push("help", outputs.help());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  const runAi = async (cmd: string, question: string) => {
    if (!question) {
      push(cmd, <span className={C.err}>Usage: ai &lt;question&gt;, e.g. ai What has he won?</span>);
      return;
    }
    const id = ++seq;
    setBusy(true);
    setEntries((e) => [...e, { id, cmd, out: <span className={C.dim}>Thinking…</span> }]);
    const update = (out: React.ReactNode) =>
      setEntries((e) => e.map((x) => (x.id === id ? { ...x, out } : x)));
    const answer = await askAssistant(
      [{ role: "user", content: question.slice(0, MAX_USER_CHARS) }],
      (t) => update(<p className="whitespace-pre-wrap">{t}</p>)
    );
    update(
      <div>
        {answer.note && <p className={C.dim}>({answer.note})</p>}
        <p className="whitespace-pre-wrap">{answer.content.replace(/\*\*/g, "")}</p>
      </div>
    );
    setBusy(false);
  };

  const run = (raw: string) => {
    const line = raw.trim();
    if (line) setHistory((h) => [...h, line]);
    setCursor(-1);
    setInput("");
    if (!line) return push("", null);
    const [name, ...rest] = line.split(/\s+/);
    const cmd = ({ certs: "certifications", cert: "certifications", ip: "research" } as Record<string, string>)[name.toLowerCase()] ?? name.toLowerCase();
    if (cmd === "clear") return setEntries([]);
    if (cmd === "ai") return void runAi(line, rest.join(" "));
    if (cmd === "resume") {
      openApp("resume");
      return push(line, <span className={C.ok}>Opening the resume…</span>);
    }
    const out = outputs[cmd];
    push(
      line,
      out ? (
        out()
      ) : (
        <span className={C.err}>
          command not found: {name}. Type <span className={C.key}>help</span> to see what you can run.
        </span>
      )
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!busy) run(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === -1) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setInput("");
      } else {
        setCursor(next);
        setInput(history[next]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(input.trim().toLowerCase()));
      if (matches.length === 1) setInput(matches[0] + (matches[0] === "ai" ? " " : ""));
      else if (matches.length > 1) push(input, <span className={C.dim}>{matches.join("   ")}</span>);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto terminal px-4 py-3 font-mono text-footnote leading-[1.6]"
      onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}
    >
      {entries.map((e) => (
        <div key={e.id} className="mb-1.5">
          {e.cmd !== undefined && (
            <p>
              <span className={C.ok}>{PROMPT}</span> {e.cmd}
            </p>
          )}
          {e.out}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <label htmlFor="terminal-input" className={`${C.ok} flex-none`}>
          {PROMPT}
          <span className="sr-only"> Terminal command</span>
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          value={input}
          onChange={(e) => {
            feedback("typing");
            setInput(e.target.value);
          }}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent text-[var(--term-fg)] caret-[var(--term-green)] outline-none"
        />
      </div>
    </div>
  );
}
