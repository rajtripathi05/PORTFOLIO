#!/usr/bin/env node
/**
 * Every Phosphor icon class used in src/ must exist, and must be written out in full.
 * UnoCSS only generates icons whose complete name appears in the source, and an unknown
 * or half-built name (`i-ph:caret-${dir}-bold`) fails silently as a blank icon.
 * Exits 1 with the offending names and files.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const known = new Set(Object.keys(require("@iconify-json/ph/icons.json").icons));

const walk = async (dir) => {
  let out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p));
    else if (/\.(tsx?|jsx?|css|html)$/.test(e.name)) out.push(p);
  }
  return out;
};

const problems = [];
let count = 0;
for (const file of [...(await walk(path.join(ROOT, "src"))), path.join(ROOT, "index.html")]) {
  const text = await fs.readFile(file, "utf8");
  const rel = path.relative(ROOT, file);
  for (const m of text.matchAll(/i-ph:([a-z0-9-]*)(\$\{)?/g)) {
    if (m[2]) {
      problems.push(`${rel}: "i-ph:${m[1]}\${…}" is built at runtime; write the full class name`);
      continue;
    }
    count++;
    if (!known.has(m[1])) problems.push(`${rel}: unknown icon "i-ph:${m[1]}"`);
  }
}

if (problems.length) {
  console.error("[icons] ✗ " + [...new Set(problems)].join("\n[icons] ✗ "));
  process.exit(1);
}
console.log(`[icons] ✓ ${count} icon references, all valid`);
