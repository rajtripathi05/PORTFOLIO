import { MAX_HISTORY, MAX_USER_CHARS, validateAction, type AssistantAction } from "~/data/assistant";
import { offlineAnswer } from "~/data/assistant-offline";
import { portfolio } from "~/data/portfolio";

export type FailReason = "not_configured" | "rate_limited" | "timeout" | "network" | "error";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  /** Answered by the scripted fallback instead of the live model. */
  offline?: boolean;
  /** Short explanation shown when the live AI couldn't answer. */
  note?: string;
  /** Why the live AI couldn't answer (set with `offline`). */
  reason?: FailReason;
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

/** Names the answer may use for each project (besides its full title). */
const PROJECT_ALIASES: Record<string, string[]> = {
  nsu: ["NSU"],
  meshcraft: ["MeshCraft"],
  tbdos: ["TBDOS"],
  "igl-safety": ["Safety & Compliance Ecosystem"],
  acg: ["ACG Pharma"],
  fmcg: ["FMCG AI"],
  financial: ["Financial Sentiment"]
};

/** Adds "Open <project>" buttons for projects the answer mentions by name. */
export const mentionedProjects = (text: string, existing: AssistantAction[]): AssistantAction[] => {
  const extra: AssistantAction[] = [];
  for (const pr of portfolio.projects) {
    const names = [pr.title.replace(/\s*\(.*\)$/, ""), ...(PROJECT_ALIASES[pr.id] ?? [])];
    if (
      names.some((n) => text.includes(n)) &&
      !existing.some((a) => a.app === "projects" && (a.id === pr.id || !a.id))
    )
      extra.push({ action: "open_app", app: "projects", id: pr.id });
  }
  return [...existing, ...extra].slice(0, 4);
};

const reasonFor = (status: number | "network" | "timeout"): FailReason => {
  if (status === "timeout" || status === 504) return "timeout";
  if (status === "network") return "network";
  if (status === 503) return "not_configured";
  if (status === 429) return "rate_limited";
  return "error";
};

const NOTES: Record<FailReason, string> = {
  not_configured: "The live AI isn't switched on right now, so this answer comes from Raj's scripted guide.",
  rate_limited: "You've asked a lot of questions quickly, so this answer comes from Raj's scripted guide.",
  timeout: "The live AI took too long, so this answer comes from Raj's scripted guide.",
  network: "The live AI couldn't be reached, so this answer comes from Raj's scripted guide.",
  error: "The live AI isn't available right now, so this answer comes from Raj's scripted guide."
};

/** The scripted answer for a question, shaped like a chat message. */
export const offlineMessage = (question: string, reason: FailReason): ChatMessage => {
  const a = offlineAnswer(question);
  return { role: "assistant", content: a.text, actions: a.actions, offline: true, reason, note: NOTES[reason] };
};

/**
 * Streams an answer from the Netlify Function. Falls back to the scripted guide on
 * any failure (missing key, rate limit, timeout, network, empty answer). Throws only
 * when `signal` aborts.
 */
export async function askAssistant(
  history: ChatMessage[],
  onDelta: (visibleText: string) => void,
  signal?: AbortSignal
): Promise<ChatMessage> {
  const question = history[history.length - 1]?.content ?? "";
  const fallback = (why: Parameters<typeof reasonFor>[0]) => offlineMessage(question, reasonFor(why));

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  let firstByte: ReturnType<typeof setTimeout> | undefined = setTimeout(abort, FIRST_BYTE_TIMEOUT_MS);
  const total = setTimeout(abort, TOTAL_TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: history
          .slice(-MAX_HISTORY)
          .map(({ role, content }) => ({ role, content: role === "user" ? content.slice(0, MAX_USER_CHARS) : content }))
      })
    });
    // A dev server without functions may answer with an HTML page: treat it as unavailable.
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !res.body || !type.startsWith("text/plain")) return fallback(res.ok ? 502 : res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(firstByte);
      firstByte = undefined;
      raw += decoder.decode(value, { stream: true });
      // Hide ACTION lines (including a partially streamed one) while streaming.
      onDelta(splitActions(raw.replace(/\n?\s*ACTION:[^\n]*$/, "")).text);
    }
    raw += decoder.decode();
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
