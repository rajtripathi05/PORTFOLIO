import { useEffect, useRef, type RefObject } from "react";

export type Dir = "up" | "down" | "left" | "right";

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right"
};

/** Arrow keys and WASD → a direction (null for any other key or with a modifier). */
export const keyDir = (e: { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean }): Dir | null =>
  e.metaKey || e.ctrlKey || e.altKey ? null : KEYS[e.key] ?? null;

/**
 * Swipe gestures on `ref` (touch, pen or mouse drag). With `chain`, one gesture can
 * fire several swipes (Snake: keep steering without lifting the finger); without it,
 * one gesture is one move (2048). The element should have `touch-action: none`.
 */
export function useSwipe(
  ref: RefObject<HTMLElement>,
  onSwipe: (dir: Dir) => void,
  { threshold = 26, chain = false }: { threshold?: number; chain?: boolean } = {}
): void {
  const handler = useRef(onSwipe);
  handler.current = onSwipe;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id = -1;
    let x = 0;
    let y = 0;
    let done = false;
    const down = (e: PointerEvent) => {
      id = e.pointerId;
      x = e.clientX;
      y = e.clientY;
      done = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id || done) return;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      handler.current(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
      if (chain) {
        x = e.clientX;
        y = e.clientY;
      } else done = true;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId === id) id = -1;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
  }, [ref, threshold, chain]);
}

/** Calls `onHidden` when the tab is hidden (games pause instead of running unseen). */
export function useOnHidden(onHidden: () => void): void {
  const handler = useRef(onHidden);
  handler.current = onHidden;
  useEffect(() => {
    const on = () => document.hidden && handler.current();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
}

export const shuffle = <T,>(list: T[]): T[] => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
