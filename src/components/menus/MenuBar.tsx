import { format } from "date-fns";
import { portfolio } from "~/data/portfolio";
import { wallpapers } from "~/configs/wallpapers";
import { shortcutLabel } from "~/utils";
import type { MenuEntry } from "./Menu";

export const downloadResume = () => {
  const a = document.createElement("a");
  a.href = portfolio.identity.resumePdf;
  a.download = "Raj_Tripathi_Resume.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default function MenuBar() {
  const openApp = useStore((s) => s.openApp);
  const setOverlay = useStore((s) => s.setOverlay);
  const closeFocused = useStore((s) => s.closeFocused);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const wallpaper = useStore((s) => s.wallpaper);
  const setWallpaper = useStore((s) => s.setWallpaper);
  const { winWidth } = useWindowSize();

  const [now, setNow] = useState(new Date());
  useInterval(() => setNow(new Date()), 15 * 1000);

  const goQuickView = () => {
    window.location.href = "/quick";
  };

  const fileMenu: MenuEntry[] = [
    { type: "item", label: "Open About Me", onSelect: () => openApp("about") },
    { type: "item", label: "Open Projects", onSelect: () => openApp("projects") },
    { type: "item", label: "Open Experience", onSelect: () => openApp("experience") },
    { type: "item", label: "Open Skills", onSelect: () => openApp("skills") },
    { type: "item", label: "Open Contact", onSelect: () => openApp("contact") },
    { type: "sep" },
    { type: "item", label: "Download Resume (PDF)", onSelect: downloadResume },
    { type: "sep" },
    { type: "item", label: "Close Window", hint: "Esc", onSelect: () => closeFocused() }
  ];

  const viewMenu: MenuEntry[] = [
    { type: "heading", label: "Appearance" },
    {
      type: "item",
      label: "Match System",
      checked: theme === "system",
      onSelect: () => setTheme("system")
    },
    { type: "item", label: "Light", checked: theme === "light", onSelect: () => setTheme("light") },
    { type: "item", label: "Dark", checked: theme === "dark", onSelect: () => setTheme("dark") },
    { type: "sep" },
    { type: "heading", label: "Wallpaper" },
    ...wallpapers.map(
      (w): MenuEntry => ({
        type: "item",
        label: w.name,
        checked: wallpaper === w.id,
        onSelect: () => setWallpaper(w.id)
      })
    ),
    { type: "sep" },
    { type: "item", label: "Show All Apps (Launchpad)", onSelect: () => setOverlay("launchpad") },
    { type: "item", label: "Quick View (simple page)", onSelect: goQuickView }
  ];

  const helpMenu: MenuEntry[] = [
    { type: "item", label: "How to use this site", onSelect: () => setOverlay("help") },
    { type: "item", label: "Quick View (simple page)", onSelect: goQuickView },
    {
      type: "item",
      label: "Search",
      hint: shortcutLabel("K"),
      onSelect: () => setOverlay("spotlight")
    },
    { type: "item", label: "Ask Raj's AI", onSelect: () => openApp("assistant") },
    { type: "sep" },
    { type: "item", label: "About This Portfolio", onSelect: () => setOverlay("credits") }
  ];

  return (
    <header className="menubar glass-menubar fixed inset-x-0 top-0 z-40 h-8 px-1.5 flex items-center justify-between">
      <nav aria-label="Menu bar" className="hstack gap-0.5 min-w-0">
        <button
          type="button"
          className="menubar-btn font-bold"
          onClick={() => openApp("about")}
          title="Open About Me"
        >
          <Monogram size={16} />
          {portfolio.identity.name}
        </button>
        <Menu id="file" label="File" ariaLabel="File menu" entries={fileMenu} />
        <Menu id="view" label="View" ariaLabel="View menu" entries={viewMenu} />
        <Menu id="help" label="Help" ariaLabel="Help menu" entries={helpMenu} />
      </nav>

      <div className="hstack gap-1.5 flex-none">
        <button
          type="button"
          className="menubar-btn"
          onClick={() => setOverlay("spotlight")}
          aria-label={`Search the portfolio (${shortcutLabel("K")})`}
          title={`Search (${shortcutLabel("K")})`}
        >
          <span className="i-ph:magnifying-glass-bold text-[15px]" />
        </button>
        <button
          type="button"
          className="menubar-pill bg-panel text-ink-1 border border-hairline hover:bg-panel-3"
          onClick={() => openApp("assistant")}
        >
          <span className="i-ph:sparkle-fill text-accent-text" aria-hidden="true" />
          Ask AI
        </button>
        <a className="menubar-pill bg-accent text-white hover:bg-accent-hover" href="/quick">
          <span className="i-ph:article-bold" aria-hidden="true" />
          Quick View
        </a>
        <button
          type="button"
          className="menubar-btn"
          onClick={toggleDark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          <span className={`${dark ? "i-ph:sun-bold" : "i-ph:moon-bold"} text-[15px]`} />
        </button>
        <time className="menubar-btn tabular-nums cursor-default" dateTime={now.toISOString()}>
          {winWidth >= 1050 && <span>{format(now, "EEE d MMM")}</span>}
          <span>{format(now, "h:mm a")}</span>
        </time>
      </div>
    </header>
  );
}
