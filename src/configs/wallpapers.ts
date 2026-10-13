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
  /** A night skyline (light = dusk). Its lit windows are a separate overlay. */
  skyline?: { light: SkylinePalette; dark: SkylinePalette };
}

export interface SkylinePalette {
  /** Sky, top → horizon. */
  sky: [string, string, string];
  /** Haze along the horizon. */
  glow: string;
  /** Sea, horizon → bottom edge. */
  sea: [string, string];
  /** Building layers, back → front, and the sea link. */
  far: string;
  mid: string;
  near: string;
  link: string;
  /** Small decorative lights (not checked for contrast, like a ribbon highlight). */
  moon: string;
  windows: string;
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

/** Mumbai at night; the light theme gets the same skyline at dusk. */
const mumbai: Wallpaper["skyline"] = {
  light: {
    sky: ["#9fb4ff", "#e7b8e8", "#ffc9a8"],
    glow: "#ffb38a",
    sea: ["#a9b9f0", "#8fa3e6"],
    far: "#b7a9e0",
    mid: "#9d8fd0",
    near: "#8d80c2",
    link: "#8a8fd0",
    moon: "#fff4d6",
    windows: "#fff3c4"
  },
  dark: {
    sky: ["#040716", "#0b1030", "#2a1a45"],
    glow: "#4a2450",
    sea: ["#0a1838", "#050b1d"],
    far: "#1a2148",
    mid: "#11163a",
    near: "#080b20",
    link: "#2a3466",
    moon: "#f3ead0",
    windows: "#ffc96b"
  }
};

export const wallpapers: Wallpaper[] = [
  { id: "peacock", name: "Peacock", background: "var(--wp-peacock)", ribbons: peacock },
  { id: "marigold", name: "Marigold", background: "var(--wp-marigold)", ribbons: marigold },
  { id: "lagoon", name: "Lagoon", background: "var(--wp-lagoon)", ribbons: lagoon },
  { id: "mumbai-night", name: "Mumbai Night", background: "var(--wp-mumbai-night)", skyline: mumbai },
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

/* ---------------------------------------------------------- skyline */

// Silhouettes only, standing on the waterline (y = G): [x, width, height, spire?].
const G = 690;
type Block = [number, number, number, number?];
const FAR: Block[] = [
  [20, 60, 330], [95, 40, 260], [150, 70, 380, 40], [600, 50, 300], [660, 80, 420],
  [760, 45, 350], [820, 70, 460, 50], [905, 55, 330], [980, 60, 280], [1050, 40, 220]
];
const MID: Block[] = [
  [0, 90, 200], [100, 70, 250], [180, 60, 170], [250, 90, 280, 30], [560, 70, 210], [640, 60, 300],
  [710, 90, 240], [810, 60, 330], [880, 80, 260], [970, 70, 190], [1050, 60, 140]
];
const NEAR: Block[] = [
  [0, 70, 110], [75, 50, 150], [130, 90, 90], [200, 60, 130], [265, 100, 70], [560, 80, 120],
  [650, 50, 160], [705, 110, 100], [820, 60, 140], [885, 90, 80], [980, 70, 120], [1055, 60, 60]
];
// A Gateway-of-India-style arch: two piers, an arched opening, four turrets and two domes.
const ARCH =
  "M400 690V585h150v105h-50v-55a25 25 0 0 0-50 0v55zM402 585v-30h20v30zM528 585v-30h20v30z" +
  "M447 585v-16h14v16zM489 585v-16h14v16zM424 585v-8h102v8zM402 555a10 8 0 0 1 20 0zM528 555a10 8 0 0 1 20 0z";
const blocks = (list: Block[]) =>
  list
    .map(([x, w, h, s]) => `M${x} ${G}v-${h}h${w}v${h}z` + (s ? `M${x + w / 2 - 1} ${G - h}v-${s}h2v${s}z` : ""))
    .join("");

// Cable-stayed sea link on the horizon: deck, two inverted-Y pylons and fanned stays.
const seaLink = () => {
  let d = "M1080 676Q1340 660 1620 670";
  let stays = "";
  for (const [x, top] of [[1290, 520], [1470, 540]]) {
    d += `M${x - 14} 672L${x} ${top + 60}L${x + 14} 670M${x} ${top + 60}V${top}`;
    for (let i = 0; i < 6; i++) stays += `M${x} ${top + 10 + i * 8}L${x - 40 - i * 26} 669M${x} ${top + 10 + i * 8}L${x + 40 + i * 26} 667`;
  }
  return { d, stays };
};

/** Mumbai Night as an SVG document (1600×1000, same framing as the ribbons). */
export const skylineSvg = (p: SkylinePalette): string => {
  const link = seaLink();
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>` +
    `<defs>` +
    `<linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${p.sky[0]}'/>` +
    `<stop offset='.45' stop-color='${p.sky[1]}'/><stop offset='.69' stop-color='${p.sky[2]}'/></linearGradient>` +
    `<linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>${stops(p.sea)}</linearGradient>` +
    `<linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${p.moon}' stop-opacity='.55'/>` +
    `<stop offset='1' stop-color='${p.moon}' stop-opacity='0'/></linearGradient>` +
    `<radialGradient id='g'><stop offset='0' stop-color='${p.glow}' stop-opacity='.8'/><stop offset='1' stop-color='${p.glow}' stop-opacity='0'/></radialGradient>` +
    `<radialGradient id='m'><stop offset='.2' stop-color='${p.moon}' stop-opacity='.45'/><stop offset='1' stop-color='${p.moon}' stop-opacity='0'/></radialGradient>` +
    `<filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='6'/></filter>` +
    `</defs>` +
    `<rect width='1600' height='1000' fill='url(#s)'/>` +
    `<ellipse cx='800' cy='${G}' rx='900' ry='150' fill='url(#g)'/>` +
    `<circle cx='960' cy='210' r='150' fill='url(#m)'/><circle cx='960' cy='210' r='34' fill='${p.moon}'/>` +
    `<path fill='none' stroke='${p.link}' stroke-width='5' d='${link.d}'/>` +
    `<path fill='none' stroke='${p.link}' stroke-width='1.2' d='${link.stays}'/>` +
    `<path fill='${p.far}' d='${blocks(FAR)}'/>` +
    `<path fill='${p.mid}' d='${blocks(MID)}'/>` +
    `<path fill='${p.near}' d='${blocks(NEAR)}${ARCH}'/>` +
    `<rect y='${G}' width='1600' height='${1000 - G}' fill='url(#w)'/>` +
    `<g filter='url(#b)' fill='url(#r)'><ellipse cx='960' cy='780' rx='30' ry='90'/>` +
    `<path d='M920 712h80v4h-80zM932 740h56v3h-56zM940 770h40v3h-40zM948 800h24v2h-24z'/></g>` +
    `</svg>`
  );
};

/**
 * The skyline's windows as their own SVG (same framing), so CSS can fade them with the
 * hour (`--lit`). Each layer's windows are hidden behind the layers in front of it, and a
 * coarse "off" pattern leaves about half of them dark. `twinkle` draws a sparse subset.
 */
export const windowsSvg = (color: string, twinkle = false): string => {
  const off = [[0, 0], [3, 0], [6, 0], [2, 1], [5, 1], [1, 2], [2, 2], [6, 2], [4, 3], [0, 4], [3, 4], [5, 4], [1, 0], [4, 1], [3, 3], [6, 3], [5, 2], [2, 4]]
    .map(([c, r]) => `M${c * 14} ${r * 18}h14v18h-14z`)
    .join("");
  const mask = (id: string, d: string) =>
    `<mask id='${id}' maskUnits='userSpaceOnUse' x='0' y='0' width='1600' height='1000'>` +
    `<rect width='1600' height='1000' fill='#fff'/><path d='${d}'/>${twinkle ? "" : "<rect width='1600' height='1000' fill='url(#q)'/>"}</mask>`;
  const [tw, th] = twinkle ? [154, 126] : [14, 18];
  const win = twinkle ? "M74 59h5v7h-5zM18 113h5v7h-5zM130 23h5v7h-5z" : "M4 5h5v7h-5z";
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>` +
    `<defs>` +
    `<pattern id='p' width='${tw}' height='${th}' patternUnits='userSpaceOnUse'><path fill='${color}' d='${win}'/></pattern>` +
    `<pattern id='q' width='98' height='90' patternUnits='userSpaceOnUse'><path d='${off}'/></pattern>` +
    mask("a", blocks(MID) + blocks(NEAR) + ARCH) +
    mask("c", blocks(NEAR) + ARCH) +
    mask("e", "") +
    `</defs>` +
    `<path mask='url(#a)' fill='url(#p)' d='${blocks(FAR)}'/>` +
    `<path mask='url(#c)' fill='url(#p)' d='${blocks(MID)}'/>` +
    `<path mask='url(#e)' fill='url(#p)' d='${blocks(NEAR)}'/>` +
    `</svg>`
  );
};

const cssUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / cover no-repeat`;

/** CSS that defines --wp-<id> (and a skyline's --wp-<id>-windows / -twinkle) for both themes. */
export const wallpaperCss = (): string => {
  const light: string[] = [];
  const dark: string[] = [];
  for (const w of wallpapers) {
    if (w.ribbons) {
      light.push(`--wp-${w.id}: ${cssUrl(ribbonSvg(w.ribbons.light, w.ribbons.flip))}, ${w.ribbons.light.bg[0]};`);
      dark.push(`--wp-${w.id}: ${cssUrl(ribbonSvg(w.ribbons.dark, w.ribbons.flip))}, ${w.ribbons.dark.bg[0]};`);
    }
    if (w.skyline) {
      for (const [out, p] of [[light, w.skyline.light], [dark, w.skyline.dark]] as const) {
        out.push(`--wp-${w.id}: ${cssUrl(skylineSvg(p))}, ${p.sky[0]};`);
        out.push(`--wp-${w.id}-windows: ${cssUrl(windowsSvg(p.windows))};`);
        out.push(`--wp-${w.id}-twinkle: ${cssUrl(windowsSvg(p.windows, true))};`);
      }
    }
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
