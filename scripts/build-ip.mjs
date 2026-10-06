#!/usr/bin/env node
/**
 * IP (copyright certificate) media pipeline.
 *
 *   media-src/ip/<name>.pdf   (originals, gitignored, local only)
 *        │  copy as-is
 *        │  page 1 → PNG (Playwright + pdf.js in local Chrome) → sharp → ~800px WebP
 *        ▼
 *   public/ip/<name>.pdf + public/ip/<name>.webp   (committed)
 *
 * Runs as part of `prebuild`. On Netlify media-src/ doesn't exist, so it exits
 * without touching anything and the committed output is used.
 * Files whose name contains "cheque" are never processed or copied.
 */
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "media-src", "ip");
const OUT = path.join(ROOT, "public", "ip");
const FORCE = process.argv.includes("--force");
const EXCLUDE = /cheque/i;
const WIDTH = 800;
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

const log = (...a) => console.log("[ip]", ...a);

if (!existsSync(SRC)) {
  log("media-src/ip not found — using the committed public/ip files.");
  process.exit(0);
}

const pdfs = (await fs.readdir(SRC)).filter((f) => /\.pdf$/i.test(f) && !EXCLUDE.test(f));
if (!pdfs.length) {
  log("no PDFs in media-src/ip.");
  process.exit(0);
}
await fs.mkdir(OUT, { recursive: true });

const fresh = async (src, out) => {
  if (FORCE || !existsSync(out)) return false;
  const [s, o] = await Promise.all([fs.stat(src), fs.stat(out)]);
  return o.mtimeMs >= s.mtimeMs;
};

let browser;
try {
  for (const file of pdfs) {
    const src = path.join(SRC, file);
    const pdfOut = path.join(OUT, file);
    const webpOut = path.join(OUT, file.replace(/\.pdf$/i, ".webp"));

    if (!(await fresh(src, pdfOut))) await fs.copyFile(src, pdfOut);
    if (await fresh(src, webpOut)) {
      log(`✓ ${file} (up to date)`);
      continue;
    }

    try {
      const [{ chromium }, { default: sharp }] = await Promise.all([import("playwright"), import("sharp")]);
      browser ??= await chromium.launch({ channel: "chrome" });
      const page = await browser.newPage();
      // Loading the worker as a plain script makes pdf.js run it on the main thread.
      await page.setContent(
        `<!doctype html><script src="${PDFJS}/pdf.min.js"></script><script src="${PDFJS}/pdf.worker.min.js"></script>`,
        { waitUntil: "load" }
      );
      const b64 = (await fs.readFile(src)).toString("base64");
      const dataUrl = await page.evaluate(
        async ({ b64, width }) => {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const doc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
          const p1 = await doc.getPage(1);
          const base = p1.getViewport({ scale: 1 });
          const viewport = p1.getViewport({ scale: (width * 2) / base.width });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await p1.render({ canvasContext: ctx, viewport }).promise;
          return canvas.toDataURL("image/png");
        },
        { b64, width: WIDTH }
      );
      await page.close();
      const png = Buffer.from(dataUrl.split(",")[1], "base64");
      await sharp(png).resize(WIDTH).webp({ quality: 80 }).toFile(webpOut);
      log(`✓ ${file} → public/ip/${path.basename(webpOut)}`);
    } catch (e) {
      console.warn(`[ip] ⚠ could not render page 1 of ${file}: ${e.message.split("\n")[0]}`);
    }
  }
} finally {
  await browser?.close();
}
