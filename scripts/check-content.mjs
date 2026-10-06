#!/usr/bin/env node
/**
 * Guards the "content is locked" rule at build time:
 *  - every project tag is a phrase that appears in that project's own text
 *  - every About Me stat value appears somewhere in the content
 *  - stale/forbidden facts never appear (old resume wording)
 * Exits 1 with a list of problems if anything fails.
 */
import { transform } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await fs.readFile(path.join(ROOT, "src/data/portfolio.ts"), "utf8");
const { code } = await transform(source, { loader: "ts", format: "esm" });
const { portfolio } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

const norm = (s) => s.toLowerCase().replace(/[-–—]/g, " ").replace(/\s+/g, " ");
const problems = [];

for (const p of portfolio.projects) {
  const text = norm([p.title, p.descriptor ?? "", ...p.bullets].join(" "));
  for (const tag of p.tags ?? [])
    if (!text.includes(norm(tag))) problems.push(`Project "${p.id}": tag "${tag}" is not in its text`);
}

const everything = norm(
  JSON.stringify({ ...portfolio, stats: undefined }) // all content except the stats themselves
);
for (const s of portfolio.stats) {
  const core = s.value.replace(/\+$/, "");
  if (!everything.includes(norm(core))) problems.push(`Stat "${s.value} ${s.label}" is not in the content`);
}

const forbidden = ["₹50 Lakhs", "50 Lakh", "HOD", "Jun 2026 – Present", "Currently working as"];
for (const f of forbidden)
  if (JSON.stringify(portfolio).includes(f)) problems.push(`Forbidden text found: "${f}"`);

// India Glycols must never read as a current role.
for (const r of [...portfolio.experience, ...portfolio.internships])
  if (/india glycols/i.test(r.org ?? "") && /present/i.test(r.dates)) problems.push(`"${r.id}": India Glycols dates say "Present"`);

// No cheque (a real bank cheque) in anything that ships.
const walk = async (dir) => {
  let out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    out = out.concat(e.isDirectory() ? await walk(p) : [p]);
  }
  return out;
};
for (const dir of ["public", "dist"])
  for (const f of await walk(path.join(ROOT, dir)))
    if (/cheque/i.test(path.basename(f))) problems.push(`Cheque file must not ship: ${path.relative(ROOT, f)}`);

if (problems.length) {
  console.error("[content] ✗ " + problems.join("\n[content] ✗ "));
  process.exit(1);
}
console.log(
  `[content] ✓ ${portfolio.projects.reduce((n, p) => n + (p.tags?.length ?? 0), 0)} tags and ${portfolio.stats.length} stats verified against the content`
);
