// Original mesh-gradient wallpapers. The gradients live in tokens.css
// (--wallpaper-*), with separate light and dark versions switched by CSS.
export interface Wallpaper {
  id: string;
  name: string;
  background: string;
}

export const wallpapers: Wallpaper[] = [
  { id: "dusk", name: "Dusk", background: "var(--wallpaper-dusk)" },
  { id: "ocean", name: "Ocean", background: "var(--wallpaper-ocean)" },
  { id: "sunrise", name: "Sunrise", background: "var(--wallpaper-sunrise)" }
];

export const getWallpaper = (id: string): Wallpaper =>
  wallpapers.find((w) => w.id === id) ?? wallpapers[0];
