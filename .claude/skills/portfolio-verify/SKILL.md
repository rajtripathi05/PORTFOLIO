---
name: portfolio-verify
description: Verify a change to Raj's portfolio site before calling it done — typecheck, content/contrast/icon checks, production build, device matrix and real-browser screenshots of the desktop, tablet and phone shells. Use after editing anything in this repo, or when asked to test, check, screenshot or review the site.
---

# Verifying the portfolio

The site has three device shells (desktop windows + dock, tablet, phone) and a plain
Quick View page, so "it compiles" is not enough. Run these in order; stop and fix at the
first failure.

## 1. Fast checks (seconds)

```bash
npm run typecheck
npm run check:content    # tags/stats come from portfolio.ts; stale facts and cheque files blocked
npm run check:contrast   # every text/background token pair, both themes, worst case over every wallpaper colour
npm run check:icons      # every i-ph:* icon exists and is written out in full
```

`check:icons` matters: UnoCSS only generates icons whose full class name appears in
source, and it also scans `.ts` data files (see `unocss.config.ts`). A name built at
runtime like `` `i-ph:caret-${dir}-bold` `` renders as a blank square, with no error.
Use a lookup table of full names instead.

## 2. Production build (≈ 30 s)

```bash
npm run build   # prebuild runs media + checks; then vite build, SSR prerender of /quick, tsc
```

## 3. Device matrix (≈ 2 min, needs the build)

```bash
npm run matrix  # 6 viewports × every app via ?open= deep links: right shell, no overflow, no errors
```

When you add an app, add its id to `APPS` in `scripts/device-matrix.mjs` and
`scripts/screenshot-review.mjs`.

## 4. Look at it

`npm run review -- <label> --axe` saves screenshots and axe-core results to
`review/<label>/` (gitignored). For targeted states, drive the installed Chrome with
Playwright (`chromium.launch({ channel: "chrome" })`). Set these keys first, or the
boot screen and welcome card cover the first seconds:

```js
localStorage.setItem("rt-portfolio:seenIntro", "1");
localStorage.setItem("rt-portfolio:welcomed", "1");
localStorage.setItem("rt-portfolio:hintShown", "1");
```

Always check light and dark (`colorScheme`), a phone (390×844, `isMobile`, `hasTouch`)
and a laptop (1440×900, plus 1280×720 for short screens). Deep links open any app:
`/?open=projects&id=nsu`, `/?open=arcade&id=snake`.

## Rules that checks can't catch

- **Content is locked.** All copy comes from `src/data/portfolio.ts`. Never invent
  facts, numbers or roles; derive UI text from the data (by `id`, not array index).
  Links starting with `TODO_` render as "coming soon".
- **Privacy.** Never publish, commit or blur a file with "cheque" in its name (a real
  bank cheque). `media-src/` stays local and gitignored; only optimized media in
  `public/` ships.
- **Tokens only.** Raw colours live in `src/styles/tokens.css`; add contrast pairs to
  `scripts/check-contrast.mjs` for any new text-on-surface combination.
