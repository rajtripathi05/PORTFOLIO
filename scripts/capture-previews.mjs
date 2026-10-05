#!/usr/bin/env node
/**
 * Captures a screenshot of each project's live site (run locally, then commit):
 *   node scripts/capture-previews.mjs
 * Writes public/previews/<id>.webp (960w) + <id>-sm.webp (480w) and
 * src/data/previews.json. Projects without a live link are skipped.
 * Uses the locally installed Chrome via Playwright.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "previews");
const MANIFEST = path.join(ROOT, "src", "data", "previews.json");

const src = await fs.readFile(path.join(ROOT, "src/data/portfolio.ts"), "utf8");
const { code } = await transform(src, { loader: "ts", format: "esm" });
const { portfolio, isTodoLink } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const manifest = {};

for (const p of portfolio.projects) {
  const url = p.url ?? p.subLinks?.find((l) => !isTodoLink(l.url))?.url;
  if (!url) {
    console.log(`- ${p.id}: no live link, skipped`);
    continue;
  }
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    const png = await page.screenshot({ type: "png" });
    const meta = await sharp(png).metadata();
    await sharp(png).resize(960).webp({ quality: 74 }).toFile(path.join(OUT, `${p.id}.webp`));
    await sharp(png).resize(480).webp({ quality: 70 }).toFile(path.join(OUT, `${p.id}-sm.webp`));
    const { dominant } = await sharp(png).resize(32).stats();
    manifest[p.id] = {
      src: `/previews/${p.id}.webp`,
      srcSm: `/previews/${p.id}-sm.webp`,
      width: 960,
      height: Math.round((960 * meta.height) / meta.width),
      color: "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join(""),
      url
    };
    console.log(`✓ ${p.id}: ${url}`);
  } catch (e) {
    console.warn(`⚠ ${p.id}: could not capture ${url} (${e.message.split("\n")[0]})`);
  }
}

await browser.close();
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${path.relative(ROOT, MANIFEST)}`);
