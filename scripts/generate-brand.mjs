#!/usr/bin/env node
/**
 * Generates brand assets from the RT monogram (run once; outputs are committed):
 *   public/favicon.svg, public/apple-touch-icon.png (180), public/icon-512.png,
 *   public/og-image.png (1200×630 social card with name + headline).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");

const monogram = (stroke = "#fff") =>
  `<g fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
     <path d="M13 46V18h10.5a8 8 0 0 1 0 16H13M23 34l8 12"/><path d="M35 18h17M43.5 18v28"/></g>`;

const tile = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b8def"/><stop offset="1" stop-color="#2f5fd0"/></linearGradient></defs>
  <rect width="64" height="64" rx="14.4" fill="url(#g)"/>${monogram()}</svg>`;

await fs.writeFile(path.join(PUB, "favicon.svg"), tile(64));
await sharp(Buffer.from(tile(180))).png().toFile(path.join(PUB, "apple-touch-icon.png"));
await sharp(Buffer.from(tile(512))).png().toFile(path.join(PUB, "icon-512.png"));

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="a" cx="18%" cy="22%" r="60%"><stop offset="0" stop-color="#c9d8ff"/><stop offset="1" stop-color="#c9d8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="85%" cy="15%" r="55%"><stop offset="0" stop-color="#ffd9ea"/><stop offset="1" stop-color="#ffd9ea" stop-opacity="0"/></radialGradient>
    <radialGradient id="c" cx="75%" cy="90%" r="60%"><stop offset="0" stop-color="#c4efe6"/><stop offset="1" stop-color="#c4efe6" stop-opacity="0"/></radialGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b8def"/><stop offset="1" stop-color="#2f5fd0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#f2f1f8"/>
  <rect width="1200" height="630" fill="url(#a)"/><rect width="1200" height="630" fill="url(#b)"/><rect width="1200" height="630" fill="url(#c)"/>
  <rect x="96" y="96" width="1008" height="438" rx="28" fill="#ffffff" fill-opacity="0.82" stroke="#000" stroke-opacity="0.08"/>
  <g transform="translate(150 170) scale(2.4)"><rect width="64" height="64" rx="14.4" fill="url(#t)"/>${monogram()}</g>
  <text x="340" y="250" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="76" font-weight="700" fill="#1b1b1e" letter-spacing="-1.5">Raj Tripathi</text>
  <text x="342" y="312" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#45454d">B.Tech — Artificial Intelligence &amp; Data Science</text>
  <text x="342" y="354" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#45454d">KJ Somaiya College of Engineering, Mumbai</text>
  <text x="342" y="450" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="26" font-weight="600" fill="#2353c9">Portfolio · Projects · Hackathon wins · Ask my AI</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(path.join(PUB, "og-image.png"));
console.log("✓ favicon.svg, apple-touch-icon.png, icon-512.png, og-image.png");
