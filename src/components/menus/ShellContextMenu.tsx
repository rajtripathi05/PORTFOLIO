import { apps, type AppId } from "~/configs/apps";
import { wallpapers } from "~/configs/wallpapers";
import { copyText, deepLinkUrl } from "~/utils";
import type { MenuEntry } from "./Menu";

// Quick View section that matches each app (for "Open in Quick View").
const quickSection: Partial<Record<AppId, string>> = {
  about: "#top",
  experience: "#experience",
  projects: "#projects",
  achievements: "#achievements",
  skills: "#skills",
  contact: "#contact"
};

/** Right-click menus for the desktop background and dock icons. */
export default function ShellContextMenu() {
  const menu = useStore((s) => s.contextMenu);
  const setContextMenu = useStore((s) => s.setContextMenu);
  const openApp = useStore((s) => s.openApp);
  const setOverlay = useStore((s) => s.setOverlay);
  const toggleDark = useStore((s) => s.toggleDark);
  const dark = useStore((s) => s.dark);
  const wallpaper = useStore((s) => s.wallpaper);
  const setWallpaper = useStore((s) => s.setWallpaper);
  const showToast = useStore((s) => s.showToast);

  if (!menu) return null;
  const close = () => setContextMenu(null);

  let entries: MenuEntry[];
  let label: string;
  if (menu.kind === "dock" && menu.app) {
    const app = apps.find((a) => a.id === menu.app);
    if (!app) return null;
    label = `${app.title} options`;
    entries = [
      { type: "item", label: `Open ${app.title}`, onSelect: () => openApp(app.id) },
      {
        type: "item",
        label: "Open in Quick View",
        onSelect: () => (window.location.href = `/quick${quickSection[app.id] ?? ""}`)
      },
      {
        type: "item",
        label: "Copy link",
        onSelect: async () => showToast((await copyText(deepLinkUrl(app.id))) ? "Link copied ✓" : "Couldn't copy the link")
      }
    ];
  } else {
    label = "Desktop options";
    entries = [
      { type: "heading", label: "Change Wallpaper" },
      ...wallpapers.map(
        (w): MenuEntry => ({
          type: "item",
          label: w.name,
          checked: wallpaper === w.id,
          onSelect: () => setWallpaper(w.id)
        })
      ),
      { type: "sep" },
      { type: "item", label: dark ? "Switch to Light Mode" : "Switch to Dark Mode", onSelect: toggleDark },
      { type: "item", label: "Quick View (simple page)", onSelect: () => (window.location.href = "/quick") },
      { type: "item", label: "About This Portfolio", onSelect: () => setOverlay("credits") }
    ];
  }

  return <ContextMenu x={menu.x} y={menu.y} ariaLabel={label} entries={entries} onClose={close} />;
}
