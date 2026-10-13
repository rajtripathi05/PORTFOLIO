/**
 * Easter egg: type "vadapav" anywhere (or run `vada pav` in the Terminal) and it rains
 * vada pavs. Deliberately not listed in Help.
 */
import { useStore } from "~/stores";
import { feedback } from "~/sensory/feedback";

const WORD = "vadapav";
const COOLDOWN_MS = 10_000;
let last = 0;

const isTyping = (el: Element | null) =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable);

/** Fires the effect (at most once per 10 s). */
export function vadaPav(): void {
  const now = Date.now();
  if (now - last < COOLDOWN_MS) return;
  last = now;
  feedback("success");
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced || document.hidden) {
    useStore.getState().showToast("Vada pav! 🌶️");
    return;
  }
  import("./rain").then((m) => m.rain());
}

/** Keeps the last 10 printable keys; returns the cleanup. */
export function listenForVadaPav(): () => void {
  let buffer = "";
  const onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || isTyping(document.activeElement)) return;
    if (e.key === " ") return; // spaces are ignored ("vada pav" works too)
    buffer = (buffer + e.key.toLowerCase()).slice(-10);
    if (buffer.endsWith(WORD)) {
      buffer = "";
      vadaPav();
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
