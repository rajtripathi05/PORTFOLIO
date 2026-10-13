---
name: arcade-game
description: Add or change a game in the portfolio's Arcade app (Snake, 2048, Memory, Minesweeper, Tic-Tac-Toe, Raj Quiz) — the game contract, registry, shared UI and input helpers, scores, styling tokens, and how to test it. Use when asked to add a game, fix a game, or change how the Arcade works.
---

# Arcade games

App: `src/apps/Arcade.tsx` (library grid → game view). Games: `src/features/games/`.

## Contract

A game is a default-exported component in `src/features/games/<Name>.tsx`:

```ts
interface GameProps {
  size: number;                         // largest square the board may use (measured)
  onFinish: (score: number) => boolean; // record a finished round; true = new best
  best?: number;                        // the visitor's best so far
}
```

## Add a game

1. Add the id to `GameId` in `types.ts`.
2. Register it in `registry.ts`: title, one-line tagline, controls text for keys and
   touch, `glyph` (a **full** `i-ph:*` class name), `tile` class, `unit`
   (`points | moves | seconds | correct | wins`), `lowerIsBetter`, and
   `load: () => import("./Name")`. Each game is its own chunk.
3. Add the tile gradient tokens (`--icon-game-<id>-1/2`) in `tokens.css` and a
   `.tile-game-<id>` rule in `games.css`.
4. Spotlight, the Terminal (`play <id>`) and the widget pick it up from the registry.

## Build it with the shared pieces

- `ui.tsx`: `Stats` (score chips), `Overlay` (ready / paused / game-over card with
  optional "New best!" badge), `ToolButton`, `useTokenColors` (read tokens for canvas).
- `input.ts`: `keyDir` (arrows + WASD), `useSwipe(ref, fn, { chain })`, `useOnHidden`
  (pause when the tab hides), `shuffle`.
- Feedback: `feedback("tap" | "success" | "error" | "selection", { el })` from
  `~/sensory/feedback` gives the sound, haptic and visual cue together.

## Must-haves

- Playable by **keyboard and touch**. Boards get `touch-action: none` (already on
  `.game-board`, `.game-2048`, `.game-mines`, `.game-ttt`); grids use roving tabindex
  with arrow keys.
- Pause rather than run unseen (`useOnHidden`); loops via `requestAnimationFrame`. Read
  `draw`/`step` through refs so a theme change mid-game applies at once.
- `prefers-reduced-motion`: no spins, shakes or pops (see the block at the end of
  `games.css`).
- Colours from tokens only. Check every new text/background pair in
  `scripts/check-contrast.mjs`. 2048-style big bold numerals count as large text (3:1).
- Games about Raj (Quiz, Memory) read facts from `src/data/portfolio.ts` **by id**.
  Never hard-code or invent a fact. Wrong answers come from Raj's own other entries, or
  are clearly-wrong numbers, never from invented third-party names.

## Test

`npm run check:icons && npm run typecheck`, then play it in Chrome with Playwright via
`/?open=arcade&id=<id>`. Send real keys or clicks and screenshot ready, playing and
over states, in light and dark, on a laptop and a phone (touch).
