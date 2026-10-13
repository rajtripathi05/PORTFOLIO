import type React from "react";
import { motion } from "framer-motion";
import { wallpapers } from "~/configs/wallpapers";
import type { GlassStyle } from "~/features/glass";
import { feedback } from "~/sensory/feedback";
import { useSensory } from "~/sensory/settings";
import { spring } from "~/styles/motion";
import { MENU_BAR_HEIGHT } from "~/utils";

const Tile = ({
  on,
  icon,
  title,
  state,
  onClick
}: {
  on: boolean;
  icon: string;
  title: string;
  state: string;
  onClick: (el: HTMLElement) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    className="cc-tile glass glass-press"
    onClick={(e) => onClick(e.currentTarget)}
  >
    <span className={`cc-icon${on ? " is-on" : ""}`} aria-hidden="true">
      <span className={`${icon} text-[18px]`} />
    </span>
    <span className="min-w-0">
      <span className="block text-footnote font-bold leading-tight">{title}</span>
      <span className="block text-caption text-ink-2">{state}</span>
    </span>
  </button>
);

/**
 * Control Center: theme, sound, ambient music, volume, wallpaper and glass style.
 * A panel under the menu bar on the desktop; a sheet from the top on phones and tablets.
 */
export default function ControlCenter({ onClose, touch = false }: { onClose: () => void; touch?: boolean }) {
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const wallpaper = useStore((s) => s.wallpaper);
  const setWallpaper = useStore((s) => s.setWallpaper);
  const glass = useStore((s) => s.glass);
  const setGlass = useStore((s) => s.setGlass);
  const openApp = useStore((s) => s.openApp);
  const muted = useSensory((s) => s.muted);
  const ambient = useSensory((s) => s.ambient);
  const volume = useSensory((s) => s.volume);
  const toggleMute = useSensory((s) => s.toggleMute);
  const setPrefs = useSensory((s) => s.setPrefs);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const music = ambient && !muted;

  useEscape(onClose);
  useClickOutside(ref, (e?: Event) => {
    // The menu-bar button toggles the panel itself.
    if ((e?.target as HTMLElement | null)?.closest?.("[data-cc-toggle]")) return;
    onClose();
  });
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, []);

  const panel = (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Control Center"
      className={`cc-panel glass glass-thick${touch ? " is-touch" : ""}`}
      style={touch ? undefined : { top: MENU_BAR_HEIGHT + 6 }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: touch ? -24 : -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: touch ? -24 : -8, scale: 0.97 }}
      transition={spring.popover}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          on={dark}
          icon={dark ? "i-ph:moon-fill" : "i-ph:sun-fill"}
          title="Dark Mode"
          state={dark ? "On" : "Off"}
          onClick={(el) => {
            feedback("toggle", { el });
            toggleDark();
          }}
        />
        <Tile
          on={!muted}
          icon={muted ? "i-ph:speaker-simple-slash-fill" : "i-ph:speaker-simple-high-fill"}
          title="Sounds"
          state={muted ? "Muted" : "On"}
          onClick={(el) => {
            if (muted) {
              toggleMute();
              feedback("toggle", { el });
            } else {
              feedback("toggle", { el });
              toggleMute();
            }
          }}
        />
        <button
          type="button"
          role="switch"
          aria-checked={music}
          className="cc-tile cc-wide glass glass-press"
          onClick={(e) => {
            feedback("toggle", { el: e.currentTarget });
            setPrefs(music ? { ambient: false } : { ambient: true, muted: false });
          }}
        >
          <span className={`cc-icon${music ? " is-on" : ""}`} aria-hidden="true">
            <span className="i-ph:music-notes-fill text-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-footnote font-bold leading-tight">Ambient music</span>
            <span className="block text-caption text-ink-2">{music ? "Playing a quiet generated pad" : "Off"}</span>
          </span>
          <span className={`${music ? "i-ph:pause-fill" : "i-ph:play-fill"} text-[20px]`} aria-hidden="true" />
        </button>

        <label className="cc-tile cc-wide glass">
          <span className="i-ph:speaker-simple-low-fill text-[18px] text-ink-2" aria-hidden="true" />
          <span className="sr-only">Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            className="cc-slider"
            style={{ "--fill": `${volume * 100}%` } as React.CSSProperties}
            onChange={(e) => setPrefs({ volume: Number(e.target.value) })}
            onPointerUp={() => feedback("tap")}
          />
          <span className="i-ph:speaker-simple-high-fill text-[18px] text-ink-2" aria-hidden="true" />
        </label>

        <div className="cc-tile cc-wide glass !block">
          <p className="mb-2 text-caption font-bold uppercase tracking-wide text-ink-2" id="cc-wallpaper">
            Wallpaper
          </p>
          <div role="radiogroup" aria-labelledby="cc-wallpaper" className="grid grid-cols-4 gap-2">
            {wallpapers.map((w) => (
              <button
                key={w.id}
                type="button"
                role="radio"
                aria-checked={wallpaper === w.id}
                aria-label={w.name}
                title={w.name}
                className={`cc-wallpaper${wallpaper === w.id ? " is-on" : ""}`}
                style={{ background: w.background }}
                onClick={(e) => {
                  feedback("selection", { el: e.currentTarget });
                  setWallpaper(w.id);
                }}
              />
            ))}
          </div>
        </div>

        <div className="cc-tile cc-wide glass justify-between">
          <span className="text-footnote font-bold" id="cc-glass">
            Glass
          </span>
          <div role="radiogroup" aria-labelledby="cc-glass" className="game-segmented !border-0 bg-[var(--hover-tint)]">
            {(["clear", "tinted"] as GlassStyle[]).map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={glass === g}
                className={glass === g ? "is-on" : ""}
                onClick={(e) => {
                  feedback("selection", { el: e.currentTarget });
                  setGlass(g);
                }}
              >
                {g === "clear" ? "Clear" : "Tinted"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="btn-ghost btn-sm mt-2 w-full"
        onClick={() => {
          onClose();
          openApp("settings");
        }}
      >
        <span className="i-ph:gear-six-bold" aria-hidden="true" />
        All settings
      </button>
    </motion.div>
  );

  if (!touch) return panel;
  return (
    <motion.div
      className="fixed inset-0 z-[160] bg-scrim-light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.18 }}
    >
      {panel}
    </motion.div>
  );
}
