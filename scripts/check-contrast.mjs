#!/usr/bin/env node
/**
 * WCAG contrast check for design-token pairs, in light and dark themes.
 * Translucent backgrounds (materials, chips, scrims) are composited over every
 * colour stop of every wallpaper (or over the surface they sit on) and the worst
 * case is reported. Exits 1 if any pair is below its threshold.
 *
 *   node scripts/check-contrast.mjs            # table
 *   node scripts/check-contrast.mjs --json     # machine-readable
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(ROOT, "src/styles/tokens.css"), "utf8");

const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  return "";
};
const parseVars = (text) => {
  const vars = {};
  for (const m of text.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].replace(/\s+/g, " ").trim();
  return vars;
};
const light = parseVars(block(":root"));
const dark = { ...light, ...parseVars(block(".dark")) };

const resolve = (vars, value, depth = 0) =>
  depth > 10 ? value : value.replace(/var\(--([\w-]+)\)/g, (_, n) => resolve(vars, vars[n] ?? "", depth + 1));

const parseColor = (s) => {
  s = s.trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)).concat(1);
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  throw new Error(`Unparseable colour: ${s}`);
};
const over = (top, bottom) => {
  const a = top[3];
  return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
};
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const wallpaperStops = (vars) =>
  ["dusk", "ocean", "sunrise"].flatMap((w) =>
    [...resolve(vars, vars[`wallpaper-${w}`]).matchAll(/#[0-9a-f]{6}/gi)].map((m) => ({ w, c: parseColor(m[0]) }))
  );

// [label, foreground token, background token(s) composited bottom→top, minimum ratio]
// Background "WALLPAPER" means: worst case over every wallpaper colour stop.
const AA = 4.5;
const LARGE = 3;
const pairs = [
  ["Primary text on surface", "text-1", ["surface"], AA],
  ["Primary text on surface-2", "text-1", ["surface-2"], AA],
  ["Primary text on surface-3", "text-1", ["surface-3"], AA],
  ["Secondary text on surface", "text-2", ["surface"], AA],
  ["Secondary text on surface-2", "text-2", ["surface-2"], AA],
  ["Secondary text on surface-3", "text-2", ["surface-3"], AA],
  ["Tertiary text on surface", "text-3", ["surface"], AA],
  ["Tertiary text on surface-2", "text-3", ["surface-2"], AA],
  ["Tertiary text on surface-3", "text-3", ["surface-3"], AA],
  ["Accent text (links) on surface", "accent-text", ["surface"], AA],
  ["Accent text on surface-2", "accent-text", ["surface-2"], AA],
  ["Accent text on accent-subtle", "accent-text", ["surface", "accent-subtle"], AA],
  ["On-accent on accent (buttons)", "on-accent", ["accent"], AA],
  ["On-accent on accent hover", "on-accent", ["accent-hover"], AA],
  ["On-accent on accent active", "on-accent", ["accent-active"], AA],
  ["Warning text on warning-subtle", "warning-text", ["warning-subtle"], AA],
  ["Success on surface", "success", ["surface"], AA],
  ["Danger on surface", "danger", ["surface"], AA],
  ["Menu bar text on menu-bar material", "text-1", ["WALLPAPER", "material-menubar"], AA],
  ["Dock label on dock material", "text-1", ["WALLPAPER", "material-menubar"], AA],
  ["Menu item text on popover", "text-1", ["WALLPAPER", "material-popover"], AA],
  ["Menu hint on popover", "text-3", ["WALLPAPER", "material-popover"], AA],
  ["Window title on sidebar material", "text-2", ["WALLPAPER", "material-sidebar"], AA],
  ["Unfocused title on sidebar material", "text-3", ["WALLPAPER", "material-sidebar"], AA],
  ["Desktop icon label on label chip", "text-1", ["WALLPAPER", "label-chip"], AA],
  ["Desktop icon label on wallpaper (none)", "text-1", ["WALLPAPER"], AA],
  ["White text on media chip (over white photo)", "on-media", ["web-bg", "media-chip"], AA],
  ["White text on lightbox scrim (over white photo)", "on-media", ["web-bg", "scrim-strong"], AA],
  ["Toast text", "on-media", ["web-bg", "toast-bg"], AA],
  ["Terminal text", "term-fg", ["term-bg"], AA],
  ["Terminal dim", "term-dim", ["term-bg"], AA],
  ["Terminal green", "term-green", ["term-bg"], AA],
  ["Terminal blue", "term-blue", ["term-bg"], AA],
  ["Terminal yellow", "term-yellow", ["term-bg"], AA],
  ["Terminal red", "term-red", ["term-bg"], AA],
  ["Safari tile initials (large) on about-2", "on-media", ["icon-about-2"], LARGE],
  ["Safari tile initials (large) on skills-2", "on-media", ["icon-skills-2"], LARGE],
  ["Safari tile initials (large) on experience-2", "on-media", ["icon-experience-2"], LARGE],
  ["Safari tile initials (large) on ai-2", "on-media", ["icon-ai-2"], LARGE],
  ["Safari tile initials (large) on file-pdf", "on-media", ["file-pdf"], LARGE],
  ["Safari tile initials (large) on projects-2", "on-media", ["icon-projects-2"], LARGE],
  ["Skills category 1 text on its tint", "cat-1", ["surface-2", "cat-1-subtle"], AA],
  ["Skills category 2 text on its tint", "cat-2", ["surface-2", "cat-2-subtle"], AA],
  ["Skills category 3 text on its tint", "cat-3", ["surface-2", "cat-3-subtle"], AA],
  ["Skills category 4 text on its tint", "cat-4", ["surface-2", "cat-4-subtle"], AA],
  ["Skills category 5 text on its tint", "cat-5", ["surface-2", "cat-5-subtle"], AA],
  ["Skills category 6 text on its tint", "cat-6", ["surface-2", "cat-6-subtle"], AA],
  ["Focus ring vs surface (non-text 3:1)", "ring", ["surface"], LARGE]
];

const evaluate = (vars, theme) =>
  pairs.map(([label, fg, layers, min]) => {
    const fgc = parseColor(resolve(vars, `var(--${fg})`));
    const bases = layers[0] === "WALLPAPER" ? wallpaperStops(vars).map((s) => s.c) : [null];
    let worst = Infinity;
    for (const base of bases) {
      let bg = base ?? [255, 255, 255, 1];
      for (const layer of layers) {
        if (layer === "WALLPAPER") continue;
        bg = over(parseColor(resolve(vars, `var(--${layer})`)), bg);
      }
      worst = Math.min(worst, ratio(over(fgc, bg), bg));
    }
    return { theme, label, ratio: Math.round(worst * 100) / 100, min, pass: worst >= min };
  });

const results = [...evaluate(light, "light"), ...evaluate(dark, "dark")];
if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
else {
  const w = Math.max(...pairs.map((p) => p[0].length));
  console.log(`${"Pair".padEnd(w)}  light   dark    min`);
  for (const [label, , , min] of pairs) {
    const l = results.find((r) => r.theme === "light" && r.label === label);
    const d = results.find((r) => r.theme === "dark" && r.label === label);
    const cell = (r) => `${r.ratio.toFixed(2).padStart(5)}${r.pass ? " " : "✗"}`;
    console.log(`${label.padEnd(w)}  ${cell(l)}  ${cell(d)}  ${min}`);
  }
  const failed = results.filter((r) => !r.pass);
  console.log(failed.length ? `\n${failed.length} pair(s) below threshold.` : `\nAll ${results.length} pairs pass.`);
}
process.exitCode = results.some((r) => !r.pass) ? 1 : 0;
