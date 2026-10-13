/**
 * Original wallpapers, designed for Liquid Glass: glass only reads as glass over colour.
 *
 * "Ribbon" wallpapers are SVGs built from a palette, in a light and a dark version, and
 * installed as CSS custom properties (`--wp-<id>`) for :root and .dark, so the theme
 * switch stays pure CSS. "Mist" is the calm mesh gradient from tokens.css.
 *
 * Every palette colour is checked by scripts/check-contrast.mjs (text on glass over the
 * wallpaper, worst case). Light palettes keep luminance ≥ 0.23 so dark text passes AA;
 * dark palettes keep it ≤ 0.16 so light text does. This module has no imports, so that
 * script can load it directly.
 */

export interface RibbonPalette {
  /** Background gradient, top-left → bottom-right. */
  bg: [string, string];
  /** Soft glows: [bottom-left, top-right]. */
  glow: [string, string];
  /** Blurred back ribbon, crisp main ribbon and front ribbon, left → right. */
  back: [string, string, string];
  main: [string, string, string];
  front: [string, string, string];
  /** Thin light catching the ribbon folds (decorative; never under text). */
  highlight: string;
}

export interface Wallpaper {
  id: string;
  name: string;
  /** CSS background value; a custom property, so light/dark is handled by CSS. */
  background: string;
  ribbons?: { light: RibbonPalette; dark: RibbonPalette; flip?: boolean };
}

const peacock: Wallpaper["ribbons"] = {
  light: {
    bg: ["#d6e4ff", "#efe2ff"],
    glow: ["#ffc278", "#a9ecff"],
    back: ["#86a8ff", "#a58bff", "#c792ff"],
    main: ["#5fe0d0", "#6f9dff", "#a58bff"],
    front: ["#48d6c4", "#5cb8f5", "#7d96ff"],
    highlight: "#ffffff"
  },
  dark: {
    bg: ["#050817", "#0e0a22"],
    glow: ["#8a4a16", "#12407a"],
    back: ["#1a2f8f", "#2d2380", "#4f1f7a"],
    main: ["#0a6e67", "#1f3cad", "#4a2aa6"],
    front: ["#08605b", "#0c4e86", "#2338a0"],
    highlight: "#bfe6ff"
  }
};

const marigold: Wallpaper["ribbons"] = {
  flip: true,
  light: {
    bg: ["#fff0e2", "#ffe2ee"],
    glow: ["#ffd76e", "#ffb8cb"],
    back: ["#ffb877", "#ff9fb0", "#e99be0"],
    main: ["#ffc35e", "#ff9a7a", "#f58fc8"],
    front: ["#ffb347", "#ff8f8f", "#d98cf0"],
    highlight: "#ffffff"
  },
  dark: {
    bg: ["#140806", "#1a0814"],
    glow: ["#7a3a0a", "#5a1236"],
    back: ["#7a2e12", "#6a1838", "#4a1452"],
    main: ["#8a4a0c", "#7a2032", "#5a1a5e"],
    front: ["#6e3a08", "#6a1a2a", "#3e1a5a"],
    highlight: "#ffd2a8"
  }
};

const lagoon: Wallpaper["ribbons"] = {
  light: {
    bg: ["#dcf6ef", "#e0ebff"],
    glow: ["#fff0a0", "#b5f3df"],
    back: ["#8fe6c9", "#86cff0", "#9db8ff"],
    main: ["#7fe3c4", "#6fd0ef", "#8fb2ff"],
    front: ["#5ed8b0", "#5cc4e8", "#7fa6ff"],
    highlight: "#ffffff"
  },
  dark: {
    bg: ["#03110f", "#061226"],
    glow: ["#4a5210", "#0b4a3e"],
    back: ["#0b4a3e", "#0b3d5a", "#16307a"],
    main: ["#0b5e4c", "#0b4d6e", "#1a3a8a"],
    front: ["#085244", "#0a4462", "#152f78"],
    highlight: "#b8fff0"
  }
};

export const wallpapers: Wallpaper[] = [
  { id: "peacock", name: "Peacock", background: "var(--wp-peacock)", ribbons: peacock },
  { id: "marigold", name: "Marigold", background: "var(--wp-marigold)", ribbons: marigold },
  { id: "lagoon", name: "Lagoon", background: "var(--wp-lagoon)", ribbons: lagoon },
  { id: "mist", name: "Mist", background: "var(--wallpaper-dusk)" }
];

/** Unknown ids (including the retired "dusk", "ocean" and "sunrise") fall back to Peacock. */
export const getWallpaper = (id: string): Wallpaper => wallpapers.find((w) => w.id === id) ?? wallpapers[0];

/* ------------------------------------------------------------------ SVG */

const stops = (c: string[]) =>
  c.map((color, i) => `<stop offset='${(i / (c.length - 1)).toFixed(2)}' stop-color='${color}'/>`).join("");

/** One wallpaper as an SVG document (1600×1000, covers any aspect ratio). */
export const ribbonSvg = (p: RibbonPalette, flip = false): string => {
  const main = "M-120 560C220 420 520 760 900 640S1420 360 1720 470";
  const front = "M-120 820C300 700 640 1000 1000 900S1460 720 1720 800";
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>` +
    `<defs>` +
    `<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>${stops(p.bg)}</linearGradient>` +
    `<linearGradient id='b' x1='0' y1='0' x2='1' y2='1'>${stops(p.back)}</linearGradient>` +
    `<linearGradient id='m' x1='0' y1='.3' x2='1' y2='.7'>${stops(p.main)}</linearGradient>` +
    `<linearGradient id='f' x1='0' y1='0' x2='1' y2='0'>${stops(p.front)}</linearGradient>` +
    `<linearGradient id='h' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${p.highlight}' stop-opacity='0'/>` +
    `<stop offset='.35' stop-color='${p.highlight}' stop-opacity='.8'/><stop offset='.7' stop-color='${p.highlight}' stop-opacity='.2'/>` +
    `<stop offset='1' stop-color='${p.highlight}' stop-opacity='0'/></linearGradient>` +
    `<radialGradient id='g1'><stop offset='0' stop-color='${p.glow[0]}' stop-opacity='.9'/><stop offset='1' stop-color='${p.glow[0]}' stop-opacity='0'/></radialGradient>` +
    `<radialGradient id='g2'><stop offset='0' stop-color='${p.glow[1]}' stop-opacity='.85'/><stop offset='1' stop-color='${p.glow[1]}' stop-opacity='0'/></radialGradient>` +
    `<filter id='s1' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='26'/></filter>` +
    `<filter id='s2' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='5'/></filter>` +
    `</defs>` +
    `<rect width='1600' height='1000' fill='url(#bg)'/>` +
    `<g${flip ? " transform='matrix(-1 0 0 1 1600 0)'" : ""}>` +
    `<ellipse cx='1240' cy='170' rx='470' ry='290' fill='url(#g2)'/>` +
    `<ellipse cx='280' cy='860' rx='560' ry='320' fill='url(#g1)'/>` +
    `<path filter='url(#s1)' opacity='.78' fill='url(#b)' d='M-120 300C260 140 520 520 860 430S1380 120 1720 260L1720 520C1380 380 1120 700 820 700S260 520-120 640Z'/>` +
    `<path filter='url(#s2)' opacity='.92' fill='url(#m)' d='${main}L1720 760C1420 640 1180 960 840 930S240 760-120 880Z'/>` +
    `<path opacity='.9' fill='url(#f)' d='${front}L1720 1120L-120 1120Z'/>` +
    `<path fill='none' stroke='url(#h)' stroke-width='3' filter='url(#s2)' d='${main}'/>` +
    `<path fill='none' stroke='url(#h)' stroke-width='2' opacity='.7' d='${front}'/>` +
    `</g></svg>`
  );
};

const cssUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / cover no-repeat`;

/** CSS that defines --wp-<id> for both themes. */
export const wallpaperCss = (): string => {
  const light: string[] = [];
  const dark: string[] = [];
  for (const w of wallpapers) {
    if (!w.ribbons) continue;
    light.push(`--wp-${w.id}: ${cssUrl(ribbonSvg(w.ribbons.light, w.ribbons.flip))}, ${w.ribbons.light.bg[0]};`);
    dark.push(`--wp-${w.id}: ${cssUrl(ribbonSvg(w.ribbons.dark, w.ribbons.flip))}, ${w.ribbons.dark.bg[0]};`);
  }
  return `:root{${light.join("")}}.dark{${dark.join("")}}`;
};

/** Installs the wallpaper variables once (idempotent). */
export const installWallpapers = (): void => {
  if (typeof document === "undefined" || document.getElementById("wallpapers")) return;
  const style = document.createElement("style");
  style.id = "wallpapers";
  style.textContent = wallpaperCss();
  document.head.appendChild(style);
};
