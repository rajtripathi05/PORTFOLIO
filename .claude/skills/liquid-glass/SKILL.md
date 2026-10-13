---
name: liquid-glass
description: The portfolio's Apple-style Liquid Glass design system — which glass class to use for a surface, refraction, the moving specular rim, wallpapers, Clear/Tinted, and the contrast and performance rules. Use when building or restyling any panel, widget, button, overlay, dock or wallpaper in this repo.
---

# Liquid Glass in this repo

Styles: `src/styles/glass.css` (material), `src/styles/tokens.css` (`--glass-*`),
`src/features/glass/` (refraction filter, light tracking, setup), wallpapers in
`src/configs/wallpapers.ts`.

## Pick the class by the surface's job

| Class | Use for | Tint (light) |
|---|---|---|
| `glass` | widgets, controls, cards on the wallpaper | `--glass-regular` 50% |
| `glass glass-clear` | dock, search pill: chrome you look *through* | `--glass-clear` 30% |
| `glass glass-thick` | text-heavy: menus, dialogs, Control Center | `--glass-thick` 80% |
| `+ glass-lens` | adds real edge refraction (Chromium only) | — |
| `+ glass-flat` | no outer shadow (glass on glass, buttons) | — |
| `+ glass-press` | spring press for glass buttons | — |
| `glass-text` | text drawn straight on glass or wallpaper (halo) | — |

`.material-menubar / -sidebar / -popover` are the older names. They map onto the same
tints, so existing components (menu bar, windows, dialogs) are glass already.

App content stays on opaque `var(--surface)`. Glass is for chrome and floating things,
not for paragraphs of text.

## How it works (so you don't break it)

- **Rim.** `::before` draws a 1px conic-gradient ring that is brightest toward
  `--light-angle` (an `@property` angle that follows the pointer or device tilt). Don't
  put `.glass` on an element whose own `::before` you need.
- **Position.** Hosts get `position: relative` through `:where()` (zero specificity), so
  `fixed`/`absolute` utilities still win. Don't add `position` to `.glass` itself.
- **Refraction.** `.glass-lens` swaps `backdrop-filter` for `url(#lg-lens) blur(2px)`. The
  filter (`LiquidFilters.tsx`) builds its displacement map from the element's own box
  (blurred flood → per-axis gradient), so it fits any size, even the magnifying dock.
  It is on only when `html[data-lens="on"]`. That is set by Chromium brand detection:
  Safari and Firefox parse `backdrop-filter: url()` but drop the whole effect, blur
  included. Keep the lens to small chrome (dock, pills, buttons). On large or
  scrolling surfaces it costs too much GPU.
- **Fallbacks.** Glass is the default under `@supports (backdrop-filter)`, and turns solid
  under `prefers-reduced-transparency: reduce`. Test for "reduce", never for
  "no-preference": Safari doesn't support the feature, so a no-preference query
  would disable glass for every iPhone.
- **Clear / Tinted.** `html[data-glass="tinted"]` raises all three tints (Settings and
  Control Center). It is set before first paint by the inline script in `index.html`.

## Wallpapers

Ribbon wallpapers are SVGs generated from a palette and installed as `--wp-<id>` for
`:root` and `.dark`. Light palettes keep every colour at luminance ≥ 0.23 (dark text
passes AA); dark palettes keep it ≤ 0.16. `scripts/check-contrast.mjs` loads the
palettes directly, so a new wallpaper is checked automatically. `wallpapers.ts` must stay
import-free for that to work.

## Before you finish

- Any new text-on-glass pair: add it to `scripts/check-contrast.mjs` and run
  `npm run check:contrast`.
- Screenshot light and dark, over at least two wallpapers.
