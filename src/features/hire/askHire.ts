import {
  cleanInput,
  MAX_JD_CHARS,
  MAX_ROLE_CHARS,
  offlineMatch,
  pitchIsGrounded,
  templatePitch,
  validPicks
} from "~/data/hire";

export interface HireMatch {
  pitch: string;
  picks: string[];
  /** Matched by keyword scoring in the browser (no AI). */
  offline: boolean;
}

const ENDPOINT = "/.netlify/functions/chat";
const TIMEOUT_MS = 20_000;

/**
 * Asks the model to pick evidence and write a pitch; anything unusable (missing key,
 * rate limit, timeout, bad JSON, too few valid ids) falls back to the offline match.
 * An AI pitch that names a number, employer or title not in its picks is replaced by
 * the template pitch.
 */
export async function askHire(roleRaw: string, jdRaw: string): Promise<HireMatch> {
  const role = cleanInput(roleRaw, MAX_ROLE_CHARS);
  const jd = cleanInput(jdRaw, MAX_JD_CHARS);
  const query = `${role} ${jd}`;
  const offline = (): HireMatch => ({ ...offlineMatch(query), offline: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "hire", role, jd }),
      signal: controller.signal
    });
    if (!res.ok) return offline();
    const data = (await res.json()) as { pitch?: unknown; picks?: unknown };
    const picks = validPicks(data.picks);
    if (picks.length < 3 || typeof data.pitch !== "string") return offline();
    const pitch = cleanInput(data.pitch, 380);
    return {
      pitch: pitch && pitchIsGrounded(pitch, picks, query) ? pitch : templatePitch(query, picks),
      picks,
      offline: false
    };
  } catch {
    return offline();
  } finally {
    clearTimeout(timer);
  }
}
