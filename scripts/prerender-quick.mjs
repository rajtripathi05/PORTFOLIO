/**
 * Pre-renders Quick View into dist/quick/index.html so the full portfolio text is
 * real HTML (crawlable, readable without JavaScript). Runs after `vite build` and
 * `vite build --ssr src/entries/quick-server.tsx --outDir .ssr`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const { render } = await import(pathToFileURL(path.join(ROOT, ".ssr", "quick-server.js")).href);

const template = await fs.readFile(path.join(DIST, "index.html"), "utf8");
const html = render();
if (!html.includes("Raj Tripathi")) throw new Error("Quick View pre-render produced unexpected output");

const page = template
  .replace("<html lang=\"en\">", "<html lang=\"en\" class=\"is-quick\">")
  .replace(/<title>.*?<\/title>/, "<title>Raj Tripathi — Quick View</title>")
  .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

await fs.mkdir(path.join(DIST, "quick"), { recursive: true });
await fs.writeFile(path.join(DIST, "quick", "index.html"), page);
// Also /quick.html, so hosts that map /quick → quick.html serve the pre-rendered page too.
await fs.writeFile(path.join(DIST, "quick.html"), page);
console.log(`[prerender] dist/quick/index.html (${(page.length / 1024).toFixed(1)} KB)`);
