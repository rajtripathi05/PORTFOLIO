/**
 * POST /.netlify/functions/chat
 * Body: { messages: { role: "user" | "assistant", content: string }[] }
 * Response: streamed text/plain answer (ACTION: lines may appear at the end).
 *
 * The OpenRouter key lives only in this function's environment variables
 * (OPENROUTER_API_KEY, OPENROUTER_MODEL, SITE_URL) and never reaches the browser.
 * Message contents and the key are never logged.
 */
import type { Context } from "@netlify/functions";
import { buildSystemPrompt, MAX_HISTORY, MAX_USER_CHARS } from "../../src/data/assistant";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const UPSTREAM_TIMEOUT_MS = 20_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Best-effort per-IP rate limit. Serverless instances are short-lived and may run in
// parallel, so this in-memory map only limits bursts hitting the same warm instance.
// For a hard limit, see "Rate limiting" in the README.
const hits = new Map<string, number[]>();

const rateLimited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > RATE_LIMIT;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });

type Msg = { role: "user" | "assistant"; content: string };

const parseMessages = (body: unknown): Msg[] | string => {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return "messages must be a non-empty array";
  const msgs = raw.slice(-MAX_HISTORY);
  for (const m of msgs) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string")
      return "invalid message";
    if (m.role === "user" && m.content.length > MAX_USER_CHARS)
      return `messages are limited to ${MAX_USER_CHARS} characters`;
    if (m.content.length > 4000) return "message too long";
  }
  if (msgs[msgs.length - 1].role !== "user") return "last message must be from the user";
  return msgs.map((m) => ({ role: m.role, content: m.content.trim() }));
};

let systemPrompt: string | null = null;

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) return json(503, { error: "not_configured" });

  const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (rateLimited(ip)) return json(429, { error: "rate_limited" });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const messages = parseMessages(body);
  if (typeof messages === "string") return json(400, { error: "bad_request", detail: messages });

  systemPrompt ??= buildSystemPrompt();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://localhost",
        "X-Title": "Raj Tripathi Portfolio"
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.3,
        max_tokens: 600,
        messages: [{ role: "system", content: systemPrompt }, ...messages]
      })
    });
  } catch (e) {
    clearTimeout(timer);
    console.error("chat: upstream request failed", (e as Error).name);
    return json(504, { error: "upstream_timeout" });
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timer);
    console.error("chat: upstream status", upstream.status);
    return json(upstream.status === 429 ? 429 : 502, {
      error: upstream.status === 429 ? "rate_limited" : "upstream_error"
    });
  }

  // Convert OpenRouter's SSE stream into a plain text stream of answer tokens.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(out) {
      try {
        // Keep reading until at least one token is enqueued: a pull() that enqueues
        // nothing (e.g. only a keep-alive comment arrived) would stall the stream.
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timer);
            out.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          let sent = false;
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue; // skips ": OPENROUTER PROCESSING" keep-alives
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (delta) {
                out.enqueue(encoder.encode(delta));
                sent = true;
              }
            } catch {
              /* partial or non-JSON line — ignore */
            }
          }
          if (sent) return;
        }
      } catch (e) {
        clearTimeout(timer);
        console.error("chat: stream interrupted", (e as Error).name);
        out.close();
      }
    },
    cancel() {
      clearTimeout(timer);
      reader.cancel().catch(() => {});
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
};
