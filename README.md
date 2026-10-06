# Raj Tripathi — Portfolio

A macOS-style desktop portfolio that anyone can use in seconds, with a plain **Quick View** page, a mobile home screen, an AI assistant grounded in the portfolio, and an accessible, token-based design system.

Built with React 18, TypeScript, Vite, UnoCSS, Zustand and Framer Motion. Deployed on Netlify.

> **Credits:** the desktop interface is based on [playground-macos](https://github.com/Renovamen/playground-macos) by Xiaohan Zou ([@Renovamen](https://github.com/Renovamen)), used under the MIT License (see `LICENSE`). Not affiliated with Apple. Icons from [Phosphor](https://phosphoricons.com/); wallpapers and the RT monogram are original.

---

## Local setup

```bash
npm install
npm run dev            # http://localhost:5173 (the AI uses its offline mode)
```

To run the site **with the AI function** locally, use the Netlify CLI:

```bash
npm install -g netlify-cli
cp .env.example .env   # then add your OpenRouter key and model
netlify dev            # http://localhost:8888
```

Production build: `npm run build` (then `npm run serve` to preview).

## Editing your content — `src/data/portfolio.ts`

Everything the site says comes from **one file**: `src/data/portfolio.ts`. Every app, Quick View, the Terminal, Spotlight search and the AI assistant's system prompt read from it.

- Edit text, roles, projects, achievements, skills and links there; nothing else needs to change.
- Any link that starts with `TODO_` (e.g. `TODO_HSE_URL`) shows as a disabled **"Link coming soon"** button. Replace it with the real URL when ready.
- `tags` on projects and `stats` (About Me / Quick View numbers) are checked at build time by `scripts/check-content.mjs`: each tag must be a phrase from that project's own text, and each stat value must appear in your content. The build fails otherwise.
- `noEmbedHosts` lists your own sites that refuse to be shown inside another page (they open in a new tab). If you allow your portfolio's domain in those sites' `frame-ancestors`/`X-Frame-Options` headers, remove the host and they'll open inside Safari.

## Achievements media

Originals live in **`media-src/achievements/<folder>/`** (gitignored, local only). Optimized copies are written to `public/achievements/` and **those** are committed.

1. Put a folder per achievement in `media-src/achievements/` (images, PDFs, videos; HEIC is converted).
2. Set `mediaFolder` on the achievement in `portfolio.ts` to the folder's exact name. Folders that match no achievement appear under "Other highlights" (rename via `otherHighlightsTitle`).
3. Run:

   ```bash
   npm run media            # add -- --force to rebuild everything
   ```

   This creates WebP images and thumbnails, blur-up previews, H.264 MP4s with poster frames (via `ffmpeg-static`), warns about files over 10 MB and `.mov`, and writes `src/data/achievements-media.json`. Captions come from file names.
4. Commit `public/achievements/` and `src/data/achievements-media.json`.

Files with "cheque" in the name are **never** published. On Netlify `media-src/` doesn't exist, so the step skips and the committed media is used.

**Live-site previews** (screenshots on the Projects cards and in Safari): `npm run previews` captures each live site with Playwright using your installed Chrome. Commit `public/previews/` and `src/data/previews.json`.

## Environment variables (Netlify → Site configuration → Environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | yes (for the live AI) | Your [OpenRouter](https://openrouter.ai/keys) key. Only the Netlify Function reads it; it never reaches the browser. |
| `OPENROUTER_MODEL` | yes (for the live AI) | Any model ID from [openrouter.ai/models](https://openrouter.ai/models). |
| `SITE_URL` | optional | Your public URL (custom domain). Used for the `HTTP-Referer` header and absolute Open Graph URLs. Netlify's own `URL` is used if it isn't set. |

Without the key or model, **"Ask Raj's AI" still works** in its scripted offline mode (answers built from `portfolio.ts`).

### Choosing the AI model

1. Browse [openrouter.ai/models](https://openrouter.ai/models) and copy a model ID (e.g. `provider/model-name`).
2. Set it as `OPENROUTER_MODEL` and redeploy (or **Trigger deploy → Clear cache and deploy**).
3. IDs ending in **`:free`** cost nothing but have strict rate limits (a small number of requests per minute and per day, and they may be busy). When OpenRouter rate-limits or a request fails, the site falls back to its offline answers with a short note. A paid model with modest pricing gives the most reliable experience.

The function sends the portfolio as the system prompt, limits user messages to 500 characters and history to the last 10 messages, streams the answer, times out after 20s, and never logs the key or message text.

### Rate limiting

`netlify/functions/chat.mts` includes a best-effort per-IP limit (20 requests per 10 minutes). Serverless instances are short-lived and may run in parallel, so it only stops bursts. For a hard limit, Netlify's platform rate limiting needs a custom function path. Add `export const config = { path: "/api/chat", rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] } }` to the function and change `ENDPOINT` in `src/lib/askAssistant.ts` to `/api/chat`.

## Deploying to Netlify

1. Push this repository to GitHub and **Add new site → Import an existing project** in Netlify.
2. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, functions in `netlify/functions`).
3. Add the environment variables above, then deploy.

`netlify.toml` also sets security headers (CSP, `X-Frame-Options: SAMEORIGIN`, HSTS…), long-term caching for hashed assets, `noindex` for `/styleguide`, and relies on `dist/404.html` for unknown URLs.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run media` | Optimize achievements media from `media-src/` |
| `npm run previews` | Screenshot live project sites for previews |
| `npm run check:content` | Verify tags/stats come from the content |
| `npm run check:contrast` | WCAG contrast ratios for every design-token pair (both themes, over each wallpaper) |
| `npm run review -- <label> --axe` | Build first; captures review screenshots + axe-core results into `review/<label>/` |
| `node scripts/generate-brand.mjs` | Regenerates favicon, touch icon and the Open Graph card |

## Design system

All colours, type sizes, spacing, radii, shadows, materials and motion live in `src/styles/tokens.css` (motion values mirrored in `src/styles/motion.ts`). Open **`/styleguide`** (not linked, `noindex`) to see every token in light and dark.

## Sound & haptics

Ambient music is **off by default** and never starts on its own. The speaker button (menu bar / mobile home) or **View → Ambient Music** turns it on. It is generated live with the Web Audio API (no audio files): a very slow pad, plus a short motif tuned to each achievement when you open it. Haptic feedback uses the Vibration API (Android) and can be turned off in **View → Haptic Feedback**.
