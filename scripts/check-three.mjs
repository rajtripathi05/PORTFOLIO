#!/usr/bin/env node
/**
 * three.js must only ever load with the Local Dash game. After `vite build`:
 * - three's code may live only in the `three-*.js` chunk (or the game's own chunk);
 * - the `three-*.js` chunk may only be imported by the game chunk (`LocalDash-*.js`).
 * Anything else means three leaked into the shell bundle. Exits 1 with the offenders.
 */
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/assets");
// Strings only three's own source contains.
const SIGNATURE = /THREE\.WebGLRenderer|WebGLRenderer: Context Lost|__THREE__/;
const isGame = (f) => /^LocalDash-.*\.js$/.test(f);
const isThree = (f) => /^three-.*\.js$/.test(f);

const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".js"));
const problems = [];
let threeSize = 0;

for (const f of files) {
  const text = await fs.readFile(path.join(DIR, f), "utf8");
  if (SIGNATURE.test(text) && !isThree(f) && !isGame(f))
    problems.push(`${f} contains three.js code`);
  if (isThree(f)) threeSize += zlib.gzipSync(text).length;
  if (isGame(f)) continue;
  // Static imports only: Vite's preload map may name the chunk, which loads nothing.
  if (!isThree(f) && /(?:from|import)\s*["']\.\/three-[^"']+\.js["']/.test(text))
    problems.push(`${f} statically imports the three chunk`);
}

if (problems.length) {
  console.error("check:three failed:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(
  threeSize
    ? `check:three ok (three chunk ${(threeSize / 1024).toFixed(1)} KB gzip, game-only)`
    : "check:three ok (three not bundled)"
);
