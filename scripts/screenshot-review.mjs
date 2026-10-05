#!/usr/bin/env node
/**
 * Visual + accessibility review.
 *
 *   npm run build
 *   node scripts/screenshot-review.mjs [label] [--axe] [--only=<substring>]
 *
 * Starts `vite preview`, drives the installed Chrome with Playwright, and saves
 * screenshots to review/<label>/ (gitignored). With --axe it also runs axe-core on
 * the desktop, every app, Quick View and mobile, writing review/<label>/axe.json.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const label = args.find((a) => !a.startsWith("--")) ?? "latest";
const runAxe = args.includes("--axe");
const only = args.find((a) => a.startsWith("--only="))?.slice(7);
const OUT = path.join(ROOT, "review", label);
const PORT = 4180;
const BASE = `http://localhost:${PORT}`;
const APPS = ["about", "projects", "experience", "achievements", "skills", "resume", "contact", "safari", "terminal"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer() {
  const proc = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT,
    shell: true,
    stdio: "ignore"
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return proc;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("vite preview did not start");
}

const axeResults = [];
async function audit(page, name) {
  if (!runAxe) return;
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  axeResults.push({
    name,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" "))
    }))
  });
  console.log(`  axe ${name}: ${r.violations.length} issue(s), ${bad.length} serious/critical`);
}

async function newPage(browser, { width, height, theme = "light", mobile = false, fresh = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: theme,
    reducedMotion: "no-preference",
    userAgent: mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined
  });
  if (!fresh)
    await context.addInitScript(() => {
      // Also runs inside the PDF viewer frame, where localStorage is null.
      try {
        localStorage.setItem("rt-portfolio:seenIntro", "1");
        localStorage.setItem("rt-portfolio:welcomed", "1");
        localStorage.setItem("rt-portfolio:hintShown", "1");
      } catch {
        /* ignore */
      }
    });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("  PAGE ERROR:", e.message));
  return { context, page };
}

const shots = [];
async function shot(page, name) {
  if (only && !name.includes(only)) return;
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  shots.push(path.relative(ROOT, file));
}

async function desktopSuite(browser, width, height, theme) {
  const tag = `desktop-${width}x${height}-${theme}`;
  const { context, page } = await newPage(browser, { width, height, theme });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(900);
  await shot(page, `${tag}-00-desktop`);
  if (theme === "light" && width === 1440) await audit(page, "desktop");

  for (const id of APPS) {
    await page.click(`#dock-${id}`);
    await sleep(1100);
    await shot(page, `${tag}-app-${id}`);
    if (theme === "light" && width === 1440) await audit(page, `app-${id}`);
    await page.keyboard.press("Escape");
    await sleep(350);
  }

  // Spotlight
  await page.keyboard.press("Control+k");
  await sleep(400);
  await page.keyboard.type("ai");
  await sleep(300);
  await shot(page, `${tag}-spotlight`);
  if (theme === "light" && width === 1440) await audit(page, "spotlight");
  await page.keyboard.press("Escape");
  await sleep(300);

  // AI panel (offline fallback, since preview has no function)
  await page.getByRole("button", { name: "Ask AI" }).first().click();
  await sleep(900);
  await page.getByRole("button", { name: "What has he won?" }).click();
  await sleep(1500);
  await shot(page, `${tag}-ai-panel`);
  if (theme === "light" && width === 1440) await audit(page, "ai-panel");
  await page.keyboard.press("Escape");
  await sleep(300);

  // Lightbox
  await page.click("#dock-achievements");
  await sleep(1000);
  await page.locator("button", { hasText: "Allianz Tech Championship" }).first().click();
  await sleep(900);
  await page.locator('button[aria-label^="Open photo"]').first().click();
  await sleep(1200);
  await shot(page, `${tag}-lightbox`);
  if (theme === "light" && width === 1440) await audit(page, "lightbox");
  await context.close();
}

async function firstVisit(browser) {
  const { context, page } = await newPage(browser, { width: 1440, height: 900, fresh: true });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await sleep(350);
  await shot(page, "first-visit-1-boot");
  await sleep(2600);
  await shot(page, "first-visit-2-welcome");
  await audit(page, "welcome");
  await page.getByRole("button", { name: "Start exploring" }).click();
  await sleep(1400);
  await shot(page, "first-visit-3-after-welcome");
  await context.close();
}

async function quickView(browser, theme) {
  const { context, page } = await newPage(browser, { width: 1440, height: 900, theme });
  await page.goto(`${BASE}/quick`, { waitUntil: "networkidle" });
  await sleep(700);
  await shot(page, `quick-1440-${theme}-1-top`);
  if (theme === "light") await audit(page, "quick-view");
  for (const id of ["projects", "achievements", "skills"]) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView(), id);
    await sleep(800);
    await shot(page, `quick-1440-${theme}-${id}`);
  }
  await context.close();
}

async function mobileSuite(browser, width, height, theme = "light") {
  const tag = `mobile-${width}x${height}-${theme}`;
  const { context, page } = await newPage(browser, { width, height, theme, mobile: true });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(700);
  await shot(page, `${tag}-1-home`);
  if (width === 390) await audit(page, "mobile-home");
  await page.locator('nav[aria-label="Dock"] button', { hasText: "Projects" }).tap();
  await sleep(1200);
  await shot(page, `${tag}-2-sheet-projects`);
  if (width === 390) await audit(page, "mobile-sheet");
  await page.getByRole("button", { name: "Done" }).tap();
  await sleep(600);
  await page.goto(`${BASE}/quick`, { waitUntil: "networkidle" });
  await sleep(700);
  await shot(page, `${tag}-3-quick`);
  await context.close();
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
const server = await startServer();
const browser = await chromium.launch({ channel: "chrome" });
try {
  console.log(`Capturing review/${label} …`);
  await firstVisit(browser);
  await desktopSuite(browser, 1440, 900, "light");
  await desktopSuite(browser, 1440, 900, "dark");
  await desktopSuite(browser, 1280, 720, "light");
  await desktopSuite(browser, 1280, 720, "dark");
  await quickView(browser, "light");
  await quickView(browser, "dark");
  await mobileSuite(browser, 390, 844);
  await mobileSuite(browser, 390, 844, "dark");
  await mobileSuite(browser, 360, 740);
  if (runAxe) await fs.writeFile(path.join(OUT, "axe.json"), JSON.stringify(axeResults, null, 2));
  console.log(`${shots.length} screenshots in review/${label}`);
} finally {
  await browser.close();
  server.kill();
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
}
