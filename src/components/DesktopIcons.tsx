import type React from "react";
import type { AppId } from "~/configs/apps";
import { MENU_BAR_HEIGHT } from "~/utils";

const icons: { app: AppId; label: string; glyph: string; color: string }[] = [
  { app: "resume", label: "Resume.pdf", glyph: "i-ph:file-pdf-fill", color: "text-[#e5533d]" },
  { app: "projects", label: "Projects", glyph: "i-ph:folder-simple-fill", color: "text-[#4aa8f0]" },
  { app: "achievements", label: "Achievements", glyph: "i-ph:folder-star-fill", color: "text-[#f0b429]" }
];

// Finder-style desktop icons. Single click (or double click) opens; arrows + Enter work too.
export default function DesktopIcons() {
  const openApp = useStore((s) => s.openApp);
  const [selected, setSelected] = useState<AppId | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const move = (to: number) => {
      e.preventDefault();
      const n = (to + icons.length) % icons.length;
      refs.current[n]?.focus();
      setSelected(icons[n].app);
    };
    if (e.key === "ArrowDown" || e.key === "ArrowRight") move(i + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(i - 1);
  };

  return (
    <nav
      aria-label="Desktop shortcuts"
      className="fixed right-3 z-[5] flex flex-col gap-2"
      style={{ top: MENU_BAR_HEIGHT + 14 }}
    >
      {icons.map((icon, i) => {
        const active = selected === icon.app;
        return (
          <button
            key={icon.app}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            className="group flex w-[92px] flex-col items-center gap-1 rounded-lg p-1.5 outline-offset-0"
            onClick={() => {
              setSelected(icon.app);
              openApp(icon.app);
            }}
            onFocus={() => setSelected(icon.app)}
            onBlur={() => setSelected((s) => (s === icon.app ? null : s))}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span
              className={`grid size-[60px] place-items-center rounded-lg transition-colors ${
                active ? "bg-black/12 dark:bg-white/15" : "group-hover:bg-black/6 dark:group-hover:bg-white/8"
              }`}
            >
              <span className={`${icon.glyph} ${icon.color} size-[52px] drop-shadow-md`} aria-hidden="true" />
            </span>
            <span
              className={`rounded px-1.5 py-px text-[12.5px] font-semibold leading-tight ${
                active ? "bg-accent text-white" : "bg-white/70 text-ink-1 dark:bg-black/45"
              }`}
            >
              {icon.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
