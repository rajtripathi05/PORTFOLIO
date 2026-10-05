#!/usr/bin/env node
/**
 * Achievements media pipeline.
 *
 *   media-src/achievements/<folder>/<files>   (originals, gitignored, local only)
 *        │  sharp: WebP full size + thumbnail, HEIC → WebP
 *        │  ffmpeg-static: videos → H.264 MP4 (+ poster frame)
 *        ▼
 *   public/achievements/<slug>/...            (optimized, committed)
 *   src/data/achievements-media.json          (manifest, committed)
 *
 * Run locally with `npm run media` (add `-- --force` to rebuild everything).
 * It also runs as `prebuild`; on Netlify media-src/ doesn't exist, so it exits
 * without touching anything and the committed output is used.
 */
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "media-src", "achievements");
const OUT = path.join(ROOT, "public", "achievements");
const MANIFEST = path.join(ROOT, "src", "data", "achievements-media.json");
const FORCE = process.argv.includes("--force");

const IMAGE = /\.(jpe?g|png|webp|gif|heic|heif|avif|tiff?)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm|avi|mkv)$/i;
const PDF = /\.pdf$/i;
// Never publish these, even if they end up in media-src again.
const EXCLUDE = /cheque/i;
const BIG_FILE_MB = 10;
const FULL_MAX = 1920;
const THUMB_MAX = 520;

const log = (...a) => console.log("[achievements]", ...a);
const warn = (...a) => console.warn("[achievements] ⚠", ...a);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "PRIZE_" → "Prize", "UNITY SCREENSHOT" → "Unity screenshot"
const prettyName = (file) => {
  let s = path.parse(file).name.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  if (s === s.toUpperCase()) s = s.charAt(0) + s.slice(1).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Prize/award shots first, then certificates, then everything else in natural order.
const rank = (f) => (/(prize|award|trophy|winner)/i.test(f) ? 0 : /certificate/i.test(f) ? 1 : 2);
const sortFiles = (files) =>
  files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, undefined, { numeric: true }));

const isFresh = async (src, out) => {
  if (FORCE || !existsSync(out)) return false;
  const [s, o] = await Promise.all([fs.stat(src), fs.stat(out)]);
  return o.mtimeMs >= s.mtimeMs;
};

// Tiny blurred preview embedded in the manifest for blur-up loading (~300 bytes each).
const blurDataUrl = async (sharp, file) =>
  "data:image/webp;base64," +
  (await sharp(file).resize(20, 20, { fit: "inside" }).webp({ quality: 40 }).toBuffer()).toString("base64");

const toHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

async function processImage(sharp, src, outDir, base) {
  const full = path.join(outDir, `${base}.webp`);
  const thumb = path.join(outDir, `${base}-thumb.webp`);
  try {
    if (!(await isFresh(src, full)))
      await sharp(src)
        .rotate()
        .resize(FULL_MAX, FULL_MAX, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(full);
    if (!(await isFresh(src, thumb)))
      await sharp(src)
        .rotate()
        .resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toFile(thumb);
    const meta = await sharp(full).metadata();
    const { dominant } = await sharp(thumb).stats();
    return {
      type: "image",
      file: `${base}.webp`,
      thumb: `${base}-thumb.webp`,
      width: meta.width,
      height: meta.height,
      color: toHex(dominant),
      blur: await blurDataUrl(sharp, thumb)
    };
  } catch (e) {
    if (/\.hei[cf]$/i.test(src))
      warn(`Couldn't convert HEIC "${path.relative(ROOT, src)}" (${e.message}). Export it as JPG and re-run.`);
    else warn(`Skipping image "${path.relative(ROOT, src)}": ${e.message}`);
    return null;
  }
}

async function probeVideo(ffmpeg, file) {
  // ffmpeg prints stream info to stderr and exits non-zero when given no output file.
  const { stderr } = await run(ffmpeg, ["-hide_banner", "-i", file]).catch((e) => e);
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr || "");
  const dim = /Video: .*?, (\d{2,5})x(\d{2,5})/.exec(stderr || "");
  return {
    duration: dur ? Math.round(+dur[1] * 3600 + +dur[2] * 60 + +dur[3]) : undefined,
    width: dim ? +dim[1] : undefined,
    height: dim ? +dim[2] : undefined
  };
}

async function processVideo(ffmpeg, sharp, src, outDir, base) {
  const out = path.join(outDir, `${base}.mp4`);
  const poster = path.join(outDir, `${base}-poster.webp`);

  if (!ffmpeg) {
    if (/\.mov$/i.test(src)) {
      warn(
        `"${path.relative(ROOT, src)}" is .mov and may not play in Chrome on Windows. ` +
          "Install ffmpeg or convert it to .mp4 (H.264) manually."
      );
      return null;
    }
    warn(`ffmpeg unavailable — copying "${path.basename(src)}" without compression.`);
    await fs.copyFile(src, out);
    return { type: "video", file: `${base}.mp4` };
  }

  if (!(await isFresh(src, out))) {
    log(`Transcoding ${path.basename(src)} → H.264 MP4 (this can take a few minutes)…`);
    await run(
      ffmpeg,
      [
        "-y", "-hide_banner", "-loglevel", "error",
        "-i", src,
        // Fit inside 1280×1280 and keep even dimensions for H.264.
        "-vf", "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k",
        "-movflags", "+faststart",
        out
      ],
      { maxBuffer: 1 << 26 }
    );
  }
  if (!(await isFresh(src, poster))) {
    const tmp = path.join(outDir, `${base}-poster.png`);
    await run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error", "-ss", "1", "-i", out, "-frames:v", "1", tmp]);
    await sharp(tmp).resize(THUMB_MAX * 2, THUMB_MAX * 2, { fit: "inside" }).webp({ quality: 72 }).toFile(poster);
    await fs.rm(tmp, { force: true });
  }
  const info = await probeVideo(ffmpeg, out);
  const { dominant } = await sharp(poster).stats();
  const mb = (await fs.stat(out)).size / 1e6;
  if (mb > BIG_FILE_MB) warn(`Compressed video ${base}.mp4 is still ${mb.toFixed(1)} MB.`);
  return {
    type: "video",
    file: `${base}.mp4`,
    poster: `${base}-poster.webp`,
    ...info,
    color: toHex(dominant),
    blur: await blurDataUrl(sharp, poster)
  };
}

async function main() {
  if (!existsSync(SRC)) {
    log("media-src/achievements not found — keeping the committed optimized media (expected on Netlify).");
    if (!existsSync(MANIFEST)) await fs.writeFile(MANIFEST, JSON.stringify({ folders: {} }, null, 2) + "\n");
    return;
  }

  const sharp = (await import("sharp")).default;
  let ffmpeg = null;
  try {
    ffmpeg = (await import("ffmpeg-static")).default;
    if (!ffmpeg || !existsSync(ffmpeg)) ffmpeg = null;
  } catch {
    ffmpeg = null;
  }
  if (!ffmpeg) warn("ffmpeg-static isn't available; videos won't be compressed.");

  await fs.mkdir(OUT, { recursive: true });
  const folders = {};
  const dirs = (await fs.readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const slug = slugify(dir.name);
    const srcDir = path.join(SRC, dir.name);
    const outDir = path.join(OUT, slug);
    await fs.mkdir(outDir, { recursive: true });

    const items = [];
    const used = new Set();
    for (const file of sortFiles(await fs.readdir(srcDir))) {
      const src = path.join(srcDir, file);
      const stat = await fs.stat(src);
      if (stat.isDirectory()) continue;
      if (EXCLUDE.test(file)) {
        warn(`Excluded "${dir.name}/${file}" (on the do-not-publish list).`);
        continue;
      }
      if (stat.size / 1e6 > BIG_FILE_MB)
        warn(`Large original: "${dir.name}/${file}" is ${(stat.size / 1e6).toFixed(1)} MB (an optimized copy is published).`);

      let base = slugify(path.parse(file).name) || "file";
      while (used.has(base)) base += "-2";
      used.add(base);

      let item = null;
      if (IMAGE.test(file)) item = await processImage(sharp, src, outDir, base);
      else if (VIDEO.test(file)) item = await processVideo(ffmpeg, sharp, src, outDir, base);
      else if (PDF.test(file)) {
        await fs.copyFile(src, path.join(outDir, `${base}.pdf`));
        item = { type: "pdf", file: `${base}.pdf` };
      } else warn(`Skipping unsupported file "${dir.name}/${file}".`);

      if (!item) continue;
      const prefix = `/achievements/${slug}/`;
      const { file: f, thumb, poster, ...rest } = item;
      items.push({
        ...rest,
        name: prettyName(file),
        src: prefix + f,
        ...(thumb && { thumb: prefix + thumb }),
        ...(poster && { poster: prefix + poster })
      });
    }
    folders[dir.name] = { slug, items };
    log(`${dir.name}: ${items.length} item(s)`);
  }

  // Remove optimized output that no longer has a source (deleted folder or file).
  const slugs = new Map(Object.values(folders).map((f) => [f.slug, f]));
  for (const d of await fs.readdir(OUT, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const folder = slugs.get(d.name);
    if (!folder) {
      await fs.rm(path.join(OUT, d.name), { recursive: true, force: true });
      log(`Removed stale folder public/achievements/${d.name}`);
      continue;
    }
    const expected = new Set(
      folder.items.flatMap((i) => [i.src, i.thumb, i.poster].filter(Boolean).map((p) => path.basename(p)))
    );
    for (const f of await fs.readdir(path.join(OUT, d.name)))
      if (!expected.has(f)) await fs.rm(path.join(OUT, d.name, f), { force: true });
  }

  await fs.writeFile(MANIFEST, JSON.stringify({ folders }, null, 2) + "\n");
  log(`Wrote ${path.relative(ROOT, MANIFEST)}`);
}

main().catch((e) => {
  // Media problems should never break the site build on Netlify; locally, fail loudly.
  warn(`Media pipeline error: ${e.stack || e.message}`);
  process.exitCode = process.env.NETLIFY ? 0 : 1;
});
