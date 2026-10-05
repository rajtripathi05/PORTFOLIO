// Original mesh-gradient wallpapers, defined in CSS so they cost no image bytes.
export interface Wallpaper {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const wallpapers: Wallpaper[] = [
  {
    id: "dusk",
    name: "Dusk",
    light:
      "radial-gradient(at 18% 22%, #c9d8ff 0px, transparent 50%), radial-gradient(at 82% 12%, #ffd9ea 0px, transparent 45%), radial-gradient(at 72% 82%, #c4efe6 0px, transparent 50%), radial-gradient(at 20% 88%, #e6dcff 0px, transparent 45%), linear-gradient(135deg, #eef2fc 0%, #f7eef4 100%)",
    dark:
      "radial-gradient(at 18% 22%, #273a86 0px, transparent 50%), radial-gradient(at 82% 12%, #5b2453 0px, transparent 45%), radial-gradient(at 72% 82%, #134a4a 0px, transparent 50%), radial-gradient(at 20% 88%, #33215f 0px, transparent 45%), linear-gradient(135deg, #0e1222 0%, #170f1f 100%)"
  },
  {
    id: "ocean",
    name: "Ocean",
    light:
      "radial-gradient(at 12% 18%, #bfe6ff 0px, transparent 50%), radial-gradient(at 88% 24%, #b8f1e3 0px, transparent 45%), radial-gradient(at 50% 92%, #c9d3ff 0px, transparent 55%), linear-gradient(160deg, #eaf6fb 0%, #e7eefc 100%)",
    dark:
      "radial-gradient(at 12% 18%, #0f4c75 0px, transparent 50%), radial-gradient(at 88% 24%, #0c5e55 0px, transparent 45%), radial-gradient(at 50% 92%, #1f2f7a 0px, transparent 55%), linear-gradient(160deg, #07141f 0%, #0a1024 100%)"
  },
  {
    id: "sunrise",
    name: "Sunrise",
    light:
      "radial-gradient(at 15% 15%, #ffe0bf 0px, transparent 50%), radial-gradient(at 85% 20%, #ffd0d6 0px, transparent 45%), radial-gradient(at 60% 90%, #fff0c2 0px, transparent 50%), linear-gradient(140deg, #fff6ee 0%, #fdeef0 100%)",
    dark:
      "radial-gradient(at 15% 15%, #6a3412 0px, transparent 50%), radial-gradient(at 85% 20%, #6b1f33 0px, transparent 45%), radial-gradient(at 60% 90%, #5a4410 0px, transparent 50%), linear-gradient(140deg, #1a100a 0%, #1c0d12 100%)"
  }
];

export const getWallpaper = (id: string): Wallpaper =>
  wallpapers.find((w) => w.id === id) ?? wallpapers[0];
