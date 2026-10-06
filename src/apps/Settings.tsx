import type React from "react";
import type { ViewAs } from "~/types";
import type { ThemePref } from "~/stores/slices/system";
import { wallpapers } from "~/configs/wallpapers";
import { feedback } from "~/sensory/feedback";
import { hapticsSupported } from "~/sensory/haptics";
import { useSensory } from "~/sensory/settings";
import { startTour } from "~/features/tour";
import { resetIntro } from "~/utils";
import { useAppHost } from "~/shells/host";

const THEMES: { id: ThemePref; label: string }[] = [
  { id: "system", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" }
];
const VIEWS: { id: ViewAs; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "phone", label: "Phone" }
];

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-7" aria-labelledby={`set-${title}`}>
    <h2 id={`set-${title}`} className="app-h2">
      {title}
    </h2>
    <div className="mt-2 divide-y divide-[var(--hairline)] rounded-card border border-hairline bg-panel">{children}</div>
  </section>
);

const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
    <div className="min-w-0">
      <p className="text-callout font-medium">{label}</p>
      {hint && <p className="text-footnote text-ink-2">{hint}</p>}
    </div>
    {children}
  </div>
);

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-button bg-panel-3 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={`min-h-[36px] rounded-[8px] px-3 text-footnote font-semibold transition-colors ${
            value === o.id ? "bg-panel text-ink-1 shadow-resting" : "text-ink-2"
          }`}
          onClick={(e) => {
            feedback("selection", { el: e.currentTarget });
            onChange(o.id);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative h-8 w-14 flex-none rounded-full transition-colors ${checked ? "bg-accent" : "bg-panel-3"}`}
      onClick={(e) => {
        feedback("toggle", { el: e.currentTarget });
        onChange(!checked);
      }}
    >
      <span
        className={`absolute top-1 size-6 rounded-full bg-white shadow-resting transition-all ${checked ? "left-7" : "left-1"}`}
      />
    </button>
  );
}

const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <input
    type="range"
    min={0}
    max={1}
    step={0.05}
    value={value}
    aria-label={label}
    className="h-8 w-40 accent-[var(--accent)]"
    onChange={(e) => onChange(Number(e.target.value))}
    onPointerUp={() => feedback("tap")}
  />
);

/** QR for the live site, written at build time; hidden when the file is missing. */
function SiteQr() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <Group title="Share">
      <Row label="Open on your phone" hint="Scan to open this site.">
        <img
          src="/qr-portfolio.svg"
          alt="QR code linking to this portfolio"
          width={112}
          height={112}
          className="rounded-button bg-white p-1"
          onError={() => setOk(false)}
        />
      </Row>
    </Group>
  );
}

export default function Settings() {
  const { shell, close } = useAppHost();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const wallpaper = useStore((s) => s.wallpaper);
  const setWallpaper = useStore((s) => s.setWallpaper);
  const viewAs = useStore((s) => s.viewAs);
  const setViewAs = useStore((s) => s.setViewAs);
  const showToast = useStore((s) => s.showToast);
  const prefs = useSensory();

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[780px] px-5 py-6">
        <h1 className="app-h1">Settings</h1>

        <Group title="Appearance">
          <Row label="Theme">
            <Segmented label="Theme" value={theme} options={THEMES} onChange={setTheme} />
          </Row>
          {shell === "desktop" && (
            <Row label="Wallpaper">
              <Segmented
                label="Wallpaper"
                value={wallpaper}
                options={wallpapers.map((w) => ({ id: w.id, label: w.name }))}
                onChange={setWallpaper}
              />
            </Row>
          )}
          <Row label="View as" hint="Force the desktop, tablet or phone layout.">
            <Segmented label="View as" value={viewAs} options={VIEWS} onChange={setViewAs} />
          </Row>
        </Group>

        <Group title="Sound & feel">
          <Row label="Mute all sounds">
            <Switch label="Mute all sounds" checked={prefs.muted} onChange={(v) => prefs.setPrefs({ muted: v })} />
          </Row>
          <Row label="Interface sounds" hint="Soft taps and chimes. Off by default if you prefer reduced motion.">
            <Switch label="Interface sounds" checked={prefs.ui} onChange={(v) => prefs.setPrefs({ ui: v })} />
          </Row>
          <Row label="Volume">
            <Slider label="Volume" value={prefs.volume} onChange={(v) => prefs.setPrefs({ volume: v })} />
          </Row>
          <Row label="Ambient music" hint="A quiet generated pad. Always off when you arrive.">
            <Switch
              label="Ambient music"
              checked={prefs.ambient}
              onChange={(v) => prefs.setPrefs(v ? { ambient: true, muted: false } : { ambient: false })}
            />
          </Row>
          <Row label="Ambient volume">
            <Slider label="Ambient volume" value={prefs.ambientVolume} onChange={(v) => prefs.setPrefs({ ambientVolume: v })} />
          </Row>
          <Row label="Typing ticks" hint="A soft tick as you type in Terminal and the AI chat.">
            <Switch label="Typing ticks" checked={prefs.typing} onChange={(v) => prefs.setPrefs({ typing: v })} />
          </Row>
          {hapticsSupported() && (
            <Row label="Haptic feedback" hint="Short vibrations on touch devices.">
              <Switch label="Haptic feedback" checked={prefs.haptics} onChange={(v) => prefs.setPrefs({ haptics: v })} />
            </Row>
          )}
        </Group>

        <SiteQr />

        <Group title="Help">
          <Row label="Take the 30-second tour">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                close();
                startTour();
              }}
            >
              Start tour
            </button>
          </Row>
          <Row label="Replay the intro" hint="Shows the welcome and start hints again on your next visit.">
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                resetIntro();
                showToast("Intro will play again next visit");
              }}
            >
              Reset
            </button>
          </Row>
        </Group>
      </div>
    </div>
  );
}
