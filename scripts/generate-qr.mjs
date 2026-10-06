#!/usr/bin/env node
/**
 * Writes public/qr-portfolio.svg — a QR code for the live site (shown in Settings).
 * Build-time only (the `qrcode` devDependency never reaches the client).
 *
 * URL: SITE_URL, else URL (Netlify sets it during builds). When neither is known
 * (local builds), nothing is written and any existing file is kept; Settings hides
 * the QR when the file is missing.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "qr-portfolio.svg");

const site = (process.env.SITE_URL || process.env.URL || "").trim().replace(/\/$/, "");
if (!/^https?:\/\//.test(site)) {
  console.log("[qr] no SITE_URL/URL set — skipped (keeping any existing public/qr-portfolio.svg).");
  process.exit(0);
}

const { default: QRCode } = await import("qrcode");
const svg = await QRCode.toString(site + "/", {
  type: "svg",
  errorCorrectionLevel: "M",
  margin: 2,
  color: { dark: "#000000", light: "#ffffff" }
});
await fs.writeFile(OUT, svg);
console.log(`[qr] public/qr-portfolio.svg → ${site}/`);
