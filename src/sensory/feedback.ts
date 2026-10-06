import type { Feedback, FeedbackName, HapticName } from "~/types";
import { useSensory } from "./settings";
import { vibrate } from "./haptics";

/** Which vibration pattern each feedback uses (none for hover/typing/boot). */
const HAPTIC: Partial<Record<FeedbackName, HapticName>> = {
  tap: "light",
  open: "light",
  close: "light",
  minimize: "light",
  toggle: "selection",
  selection: "selection",
  swipe: "selection",
  spotlight: "light",
  notify: "medium",
  success: "success",
  error: "warning"
};

/** Set by the sound engine once it has loaded (after the first interaction). */
let player: ((name: FeedbackName) => void) | null = null;
export const setPlayer = (fn: typeof player): void => {
  player = fn;
};

/** Visual micro-feedback: a short-lived data attribute styled in base.css. */
const visual = (name: FeedbackName, el: Element) => {
  el.setAttribute("data-feedback", name);
  setTimeout(() => {
    if (el.getAttribute("data-feedback") === name) el.removeAttribute("data-feedback");
  }, 700);
};

/**
 * The one call every interaction makes: fires the matching sound, haptic and visual
 * response together. Sound and haptics are never the only feedback.
 */
export const feedback: Feedback = (name, opts) => {
  const prefs = useSensory.getState();
  const haptic = HAPTIC[name];
  if (haptic && prefs.haptics) vibrate(haptic);
  player?.(name);
  if (opts?.el) visual(name, opts.el);
};
