import {
  MAX_HISTORY,
  validateAction,
  type AssistantAction
} from "~/data/assistant";
import { offlineAnswer } from "~/data/assistant-offline";
import { portfolio } from "~/data/portfolio";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  /** Answered by the scripted fallback instead of the live model. */
  offline?: boolean;
  /** Short explanation shown when the live AI couldn't answer. */
  note?: string;
}

const ENDPOINT = "/.netlify/functions/chat";
const FIRST_BYTE_TIMEOUT_MS = 15_000;
const TOTAL_TIMEOUT_MS = 40_000;

/** Splits "ACTION: {...}" lines from the visible answer and validates them. */
export const splitActions = (raw: string): { text: string; actions: AssistantAction[] } => {
  const actions: AssistantAction[] = [];
  const kept: string[] = [];
  for (const line of raw.split("\n")) {
    const m = /^\s*ACTION:\s*(\{.*\})\s*$/.exec(line);
    if (m) {
      try {
        const a = validateAction(JSON.parse(m[1]));
        if (a && !actions.some((x) => x.app === a.app && x.id === a.id)) actions.push(a);
      } catch {
        /* ignore malformed action */
      }
    } else if (!/^\s*ACTION:/.test(line)) kept.push(line);
  }
  return { text: kept.join("\n").trim(), actions: actions.slice(0, 3) };
};

/** Adds "Open <project>" buttons for projects the answer mentions by name. */
export const mentionedProjects = (text: string, existing: AssistantAction[]): AssistantAction[] => {
  const extra: AssistantAction[] = [];
  for (const pr of portfolio.projects) {
    const short = pr.title.replace(/\s*\(.*\)$/, "");
    if (
      (text.includes(short) || (pr.id === "tbdos" && text.includes("TBDOS"))) &&
      !existing.some((a) => a.app === "projects" && a.id === pr.id)
    )
      extra.push({ action: "open_app", app: "projects", id: pr.id });
  }
  return [...existing, ...extra].slice(0, 4);
};

const reasonNote = (status: number | "network" | "timeout"): string => {
  if (status === 429) return "You've asked a lot of questions quickly, so this answer comes from Raj's scripted guide.";
  if (status === "timeout") return "The live AI took too long, so this answer comes from Raj's scripted guide.";
  return "The live AI isn't available right now, so this answer comes from Raj's scripted guide.";
};

export async function askAssistant(
  history: ChatMessage[],
  onDelta: (visibleText: string) => void,
  signal?: AbortSignal
): Promise<ChatMessage> {
  const question = history[history.length - 1].content;
  const fallback = (why: Parameters<typeof reasonNote>[0]): ChatMessage => {
    const a = offlineAnswer(question);
    return { role: "assistant", content: a.text, actions: a.actions, offline: true, note: reasonNote(why) };
  };

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  let firstByte = setTimeout(abort, FIRST_BYTE_TIMEOUT_MS);
  const total = setTimeout(abort, TOTAL_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: history.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content }))
      })
    });
    if (!res.ok || !res.body) return fallback(res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(firstByte);
      firstByte = 0 as unknown as ReturnType<typeof setTimeout>;
      raw += decoder.decode(value, { stream: true });
      // Hide ACTION lines (including a partially streamed one) while streaming.
      onDelta(splitActions(raw.replace(/\n?\s*ACTION:[^\n]*$/, "")).text);
    }
    const { text, actions } = splitActions(raw);
    if (!text) return fallback(502);
    return { role: "assistant", content: text, actions: mentionedProjects(text, actions) };
  } catch (e) {
    if (signal?.aborted) throw e;
    return fallback((e as Error).name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(firstByte);
    clearTimeout(total);
    signal?.removeEventListener("abort", abort);
  }
}
