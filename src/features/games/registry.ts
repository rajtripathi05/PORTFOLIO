import type { GameDef, GameId } from "./types";

export type { GameDef, GameId, GameProps } from "./types";

/** The Arcade's games, in library order. Each one is its own code chunk. */
export const games: GameDef[] = [
  {
    id: "snake",
    title: "Snake",
    tagline: "Eat, grow, and don't bite your own tail.",
    controls: { keys: "Arrow keys or WASD to steer · Space to pause", touch: "Swipe on the board to steer" },
    glyph: "i-ph:path-bold",
    tile: "tile-game-snake",
    unit: "points",
    load: () => import("./Snake")
  },
  {
    id: "2048",
    title: "2048",
    tagline: "Slide and merge the tiles to reach 2048.",
    controls: { keys: "Arrow keys or WASD to slide", touch: "Swipe on the board to slide" },
    glyph: "i-ph:grid-four-fill",
    tile: "tile-game-2048",
    unit: "points",
    load: () => import("./Game2048")
  },
  {
    id: "quiz",
    title: "Raj Quiz",
    tagline: "How well do you know Raj? Eight quick questions.",
    controls: { keys: "1–4 to answer · Enter for the next question", touch: "Tap an answer" },
    glyph: "i-ph:lightbulb-fill",
    tile: "tile-game-quiz",
    unit: "correct",
    load: () => import("./Quiz")
  },
  {
    id: "memory",
    title: "Memory",
    tagline: "Match the pairs; each one is a piece of Raj's story.",
    controls: { keys: "Tab to a card · Enter to flip", touch: "Tap two cards to flip them" },
    glyph: "i-ph:cards-fill",
    tile: "tile-game-memory",
    unit: "moves",
    lowerIsBetter: true,
    load: () => import("./Memory")
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    tagline: "Clear the field without touching a mine.",
    controls: {
      keys: "Click to reveal · right-click or F to flag · arrow keys to move",
      touch: "Tap to reveal · long-press (or Flag mode) to flag"
    },
    glyph: "i-ph:bomb-fill",
    tile: "tile-game-mines",
    unit: "seconds",
    lowerIsBetter: true,
    load: () => import("./Minesweeper")
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    tagline: "Three in a row against the computer. Can you beat it?",
    controls: { keys: "Arrow keys to move · Enter to place", touch: "Tap a square" },
    glyph: "i-ph:hash-bold",
    tile: "tile-game-ttt",
    unit: "wins",
    load: () => import("./TicTacToe")
  }
];

export const getGame = (id: string | undefined): GameDef | undefined => games.find((g) => g.id === id);

export const isGameId = (id: unknown): id is GameId => typeof id === "string" && games.some((g) => g.id === id);

/** "24 points", "18 moves", "41 s", "7/8 correct", "3 in a row". */
export const formatScore = (game: GameDef, score: number): string => {
  switch (game.unit) {
    case "points":
      return `${score.toLocaleString()} ${score === 1 ? "point" : "points"}`;
    case "moves":
      return `${score} moves`;
    case "seconds":
      return `${score} s`;
    case "correct":
      return `${score}/8 correct`;
    case "wins":
      return `${score} in a row`;
  }
};
