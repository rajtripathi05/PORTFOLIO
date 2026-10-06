import type React from "react";
import { actionLabel, MAX_USER_CHARS, type AssistantAction } from "~/data/assistant";
import { askAssistant, type ChatMessage } from "~/lib/askAssistant";
import { useAppHost } from "~/shells/host";

const STORAGE_KEY = "rt-portfolio:chat";

const STARTERS = [
  "What did Raj do at India Glycols?",
  "Show me his best projects",
  "What has he won?",
  "What are his technical skills?",
  "How can I contact him?"
];

// Follow-up suggestions, picked by what the last answer was about.
const FOLLOW_UPS: { tag: AssistantAction["app"] | "any"; q: string }[] = [
  { tag: "projects", q: "What is the NSU Plant Cockpit?" },
  { tag: "projects", q: "Tell me about TBDOS" },
  { tag: "projects", q: "What is the FMCG AI Transformation Blueprint?" },
  { tag: "experience", q: "What did he do at MeshCraft?" },
  { tag: "experience", q: "What did he do at Godavari Biorefineries?" },
  { tag: "achievements", q: "Tell me about the Allianz Tech Championship" },
  { tag: "achievements", q: "What was the Periscope hackathon project?" },
  { tag: "skills", q: "What AI / ML skills does he have?" },
  { tag: "about", q: "Where did he study?" },
  { tag: "any", q: "Show me his best projects" },
  { tag: "any", q: "What has he won?" },
  { tag: "any", q: "How can I contact him?" },
  { tag: "any", q: "What did Raj do at India Glycols?" }
];

const loadChat = (): ChatMessage[] => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveChat = (msgs: ChatMessage[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    /* ignore */
  }
};

const suggestionsFor = (msgs: ChatMessage[]): string[] => {
  if (!msgs.length) return STARTERS;
  const asked = new Set(msgs.filter((m) => m.role === "user").map((m) => m.content));
  const last = [...msgs].reverse().find((m) => m.role === "assistant");
  const tags = new Set(last?.actions?.map((a) => a.app) ?? []);
  const related = FOLLOW_UPS.filter((f) => tags.has(f.tag as AssistantAction["app"]) && !asked.has(f.q));
  const general = FOLLOW_UPS.filter((f) => f.tag === "any" && !asked.has(f.q));
  return [...related, ...general].map((f) => f.q).slice(0, 3);
};

export default function Assistant() {
  const { shell } = useAppHost();
  const mobile = shell !== "desktop";
  const openApp = useStore((s) => s.openApp);
  const [messages, setMessages] = useState<ChatMessage[]>(loadChat);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => saveChat(messages), [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string, base: ChatMessage[] = messages) => {
    const q = text.trim().slice(0, MAX_USER_CHARS);
    if (!q || busy) return;
    const history: ChatMessage[] = [...base, { role: "user", content: q }];
    setMessages(history);
    setInput("");
    setBusy(true);
    setStreaming("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await askAssistant(history, (t) => setStreaming(t), controller.signal);
      setMessages([...history, answer]);
    } catch {
      /* aborted (window closed / new chat) */
    } finally {
      setBusy(false);
      setStreaming(null);
      if (!mobile) inputRef.current?.focus();
    }
  };

  const retry = (index: number) => {
    // Re-ask the question that produced the fallback answer at `index`.
    const q = messages[index - 1];
    if (q?.role === "user") send(q.content, messages.slice(0, index - 1));
  };

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(null);
    setBusy(false);
    inputRef.current?.focus();
  };

  const runAction = (a: AssistantAction) => openApp(a.app, a.id ? { id: a.id } : undefined);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const suggestions = busy ? [] : suggestionsFor(messages);

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex flex-none items-center justify-between gap-2 border-b border-hairline px-4 py-2">
        <p className="text-footnote text-ink-3">Answers come only from Raj's portfolio.</p>
        <button type="button" className="btn-ghost btn-sm" onClick={newChat} disabled={!messages.length && !busy}>
          <span className="i-ph:note-pencil-bold" aria-hidden="true" />
          New chat
        </button>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        <div className="flex gap-2.5">
          <span className="assistant-orb mt-0.5" aria-hidden="true" />
          <div className="rounded-panel rounded-tl-sm bg-panel-2 px-3.5 py-2.5 text-body leading-relaxed">
            Hi! I can answer questions about Raj's experience, projects, achievements, skills and how to
            contact him.
          </div>
        </div>

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-panel rounded-tr-sm bg-accent px-3.5 py-2.5 text-body leading-relaxed text-on-accent">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="assistant-orb mt-0.5" aria-hidden="true" />
              <div className="min-w-0 max-w-[88%]">
                {m.note && (
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 rounded-button bg-[var(--warning-subtle)] px-3 py-1.5 text-footnote text-[var(--warning-text)]">
                    <span className="i-ph:info-bold" aria-hidden="true" />
                    <span className="flex-1">{m.note}</span>
                    {i === messages.length - 1 && (
                      <button type="button" className="font-semibold underline" onClick={() => retry(i)}>
                        Try again
                      </button>
                    )}
                  </div>
                )}
                <div className="rounded-panel rounded-tl-sm bg-panel-2 px-3.5 py-2.5 text-body leading-relaxed">
                  <Markdown text={m.content} />
                </div>
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.actions.map((a) => (
                      <button
                        key={`${a.app}-${a.id ?? ""}`}
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => runAction(a)}
                      >
                        {actionLabel(a)}
                        <span className="i-ph:arrow-right-bold text-[13px]" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {streaming !== null && (
          <div className="flex gap-2.5">
            <span className="assistant-orb is-thinking mt-0.5" aria-hidden="true" />
            <div className="min-w-0 max-w-[88%] rounded-panel rounded-tl-sm bg-panel-2 px-3.5 py-2.5 text-body leading-relaxed">
              {streaming ? (
                <>
                  <Markdown text={streaming} />
                  <span className="stream-cursor" aria-hidden="true" />
                </>
              ) : (
                <span className="typing" aria-label="Thinking">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-none border-t border-hairline px-3 pb-3 pt-2.5">
        {suggestions.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5" aria-label="Suggested questions">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-hairline bg-panel-2 px-3 py-1.5 text-footnote font-medium text-ink-1 hover:bg-panel-3"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question about Raj
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_USER_CHARS))}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_USER_CHARS}
            placeholder="Ask about Raj's work…"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-card border border-hairline bg-panel-2 px-3.5 py-2.5 text-body text-ink-1 outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="grid size-10 flex-none place-items-center rounded-full bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-40"
            disabled={!input.trim() || busy}
            aria-label="Send question"
          >
            <span className="i-ph:arrow-up-bold text-[18px]" />
          </button>
        </form>
        <div className="mt-1.5 flex justify-between gap-3 text-caption text-ink-3">
          <span>AI answers are generated from Raj's resume and may be imperfect.</span>
          {input.length > MAX_USER_CHARS - 100 && (
            <span className="tabular-nums">
              {input.length}/{MAX_USER_CHARS}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
