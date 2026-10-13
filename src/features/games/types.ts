import type { ComponentType } from "react";

export type GameId = "local" | "snake" | "2048" | "memory" | "minesweeper" | "tictactoe" | "quiz";

/** What the Arcade gives every game. */
export interface GameProps {
  /** The largest square (px) the board can use in the current window or screen. */
  size: number;
  /** Reports a finished round. Returns true when it's a new personal best. */
  onFinish: (score: number) => boolean;
  /** The visitor's best so far (undefined before the first finished round). */
  best?: number;
}

export interface GameDef {
  id: GameId;
  title: string;
  /** One line for the library card. */
  tagline: string;
  /** How to play, per input type. */
  controls: { keys: string; touch: string };
  /** Phosphor glyph and the gradient tile class (games.css). */
  glyph: string;
  tile: string;
  /** How the score reads: "24 points", "18 moves", "41 s", "7/8". */
  unit: "points" | "moves" | "seconds" | "correct" | "wins";
  /** Moves and seconds: fewer is better. */
  lowerIsBetter?: boolean;
  load: () => Promise<{ default: ComponentType<GameProps> }>;
}
