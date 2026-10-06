#!/usr/bin/env node
/**
 * Device matrix: loads the built site on each viewport, checks the right shell mounts,
 * no horizontal overflow, no console/page errors, and that every app opens (via the
 * ?open= deep link). Screenshots are saved to review/matrix/ only for failures.
 *
 *   npm run build && node scripts/device-matrix.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "review", "matrix");
const PORT = 4181;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEVICES = [
  { name: "desktop-1440", w: 1440, h: 900, shell: "desktop" },
  { name: "laptop-1280", w: 1280, h: 720, shell: "desktop" },
  { name: "tablet-portrait", w: 820, h: 1180, shell: "tablet", touch: true },
  { name: "tablet-landscape", w: 1180, h: 820, shell: "tablet", touch: true },
  { name: "phone-390", w: 390, h: 844, shell: "phone", touch: true },
  { name: "phone-360", w: 360, h: 640, shell: "phone", touch: true }
];
const APPS = [
  "about", "projects", "experience", "achievements", "safari", "assistant", "resume",
  "contact", "research", "leadership", "certifications", "skills", "terminal", "settings"
];

const proc = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: ROOT, shell: true, stdio: "ignore" });
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    /* not up yet */
  }
  await sleep(250);
}

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const failures = [];
let checks = 0;

for (const d of DEVICES) {
  const context = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    isMobile: !!d.touch,
    hasTouch: !!d.touch,
    deviceScaleFactor: d.touch ? 2 : 1
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("rt-portfolio:seenIntro", "1");
      localStorage.setItem("rt-portfolio:welcomed", "1");
      localStorage.setItem("rt-portfolio:hintShown", "1");
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));

  const fail = async (label, why) => {
    failures.push(`${d.name} · ${label}: ${why}`);
    await page.screenshot({ path: path.join(OUT, `${d.name}-${label}.png`) }).catch(() => {});
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  for (const target of ["", ...APPS, "quick"]) {
    checks++;
    const label = target || "home";
    errors.length = 0;
    await page.goto(target === "quick" ? `${BASE}/quick` : `${BASE}/${target ? `?open=${target}` : ""}`, { waitUntil: "load" });
    await sleep(target === "quick" ? 500 : 900);
    if (target !== "quick") {
      const shell = await page.evaluate(() => document.documentElement.dataset.shell);
      if (shell !== d.shell) await fail(label, `shell "${shell}" (expected ${d.shell})`);
      if (target && !(await page.locator("[role=dialog], section[aria-labelledby^=window-title]").first().isVisible().catch(() => false)))
        await fail(label, "app did not open");
    }
    const over = await overflow();
    if (over > 1) await fail(label, `horizontal overflow ${over}px`);
    if (errors.length) await fail(label, `console errors: ${errors.slice(0, 2).join(" | ").slice(0, 160)}`);
  }
  await context.close();
}

await browser.close();
proc.kill();
if (process.platform === "win32") spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore" });

console.log(`[matrix] ${checks} page checks across ${DEVICES.length} devices, ${failures.length} failure(s)`);
failures.forEach((f) => console.log("  ✗ " + f));
process.exit(failures.length ? 1 : 0);
