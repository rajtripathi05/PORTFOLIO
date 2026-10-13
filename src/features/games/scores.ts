import { create } from "zustand";
import { storage } from "~/utils/storage";
import type { GameId } from "./types";

const KEY = "arcade";

interface Saved {
  best: Partial<Record<GameId, number>>;
  plays: Partial<Record<GameId, number>>;
}

const load = (): Saved => {
  try {
    const saved = JSON.parse(storage.get(KEY) ?? "null") as Partial<Saved> | null;
    return { best: saved?.best ?? {}, plays: saved?.plays ?? {} };
  } catch {
    return { best: {}, plays: {} };
  }
};

interface ArcadeStore extends Saved {
  /** Records a finished round; returns true for a new personal best. */
  record: (id: GameId, score: number, lowerIsBetter?: boolean) => boolean;
}

/** Personal bests and play counts, kept in this browser only. */
export const useArcade = create<ArcadeStore>((set, get) => ({
  ...load(),
  record: (id, score, lowerIsBetter = false) => {
    const { best, plays } = get();
    const prev = best[id];
    const isBest = prev === undefined || (lowerIsBetter ? score < prev : score > prev);
    const next: Saved = {
      best: isBest ? { ...best, [id]: score } : best,
      plays: { ...plays, [id]: (plays[id] ?? 0) + 1 }
    };
    set(next);
    storage.set(KEY, JSON.stringify(next));
    return isBest && prev !== undefined;
  }
}));
