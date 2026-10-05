import type React from "react";
import { apps, launchpadIcon } from "~/configs/apps";
import { wallpapers } from "~/configs/wallpapers";
import { duration } from "~/styles/motion";

// Hidden design-system reference at /styleguide (noindex, not linked, not in the sitemap).

const grays = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const accent = ["accent", "accent-hover", "accent-active", "accent-subtle", "accent-text", "ring"];
const semantic = ["success", "success-subtle", "warning-text", "warning-subtle", "danger", "danger-subtle"];
const cats = ["1", "2", "3", "4", "5", "6"];
// Full class names (UnoCSS can only see static strings).
const type: [string, string][] = [
  ["text-large font-bold tracking-[var(--ls-large)]", "Large title — 34/40"],
  ["text-title font-bold tracking-[var(--ls-title)]", "Title — 24/30"],
  ["text-headline font-semibold", "Headline — 18/24"],
  ["text-callout", "Callout — 16/24"],
  ["text-body", "Body — 14.5/22"],
  ["text-footnote", "Footnote — 13/18"],
  ["text-caption", "Caption — 11.5/15"]
];
const spaces = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const radii = ["window", "card", "button", "chip", "sm", "panel"];
const shadows = ["resting", "raised", "window", "window-focus"];
const materials = ["menubar", "sidebar", "popover"];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="app-h2 mb-3">{title}</h2>
    {children}
  </section>
);

const Swatch = ({ name }: { name: string }) => (
  <div className="flex items-center gap-3">
    <span
      className="size-10 flex-none rounded-button border border-hairline"
      style={{ background: `var(--${name})` }}
    />
    <code className="text-footnote text-ink-2">--{name}</code>
  </div>
);

function Board({ dark }: { dark: boolean }) {
  return (
    <div className={`${dark ? "dark" : ""} rounded-window border border-hairline bg-panel p-8 text-ink-1`}>
      <h1 className="text-title font-bold">{dark ? "Dark" : "Light"} theme</h1>

      <Section title="Greys">
        <div className="grid grid-cols-2 gap-2">
          {grays.map((g) => (
            <Swatch key={g} name={`gray-${g}`} />
          ))}
        </div>
      </Section>

      <Section title="Accent">
        <div className="grid grid-cols-2 gap-2">
          {accent.map((c) => (
            <Swatch key={c} name={c} />
          ))}
        </div>
      </Section>

      <Section title="Semantic">
        <div className="grid grid-cols-2 gap-2">
          {semantic.map((c) => (
            <Swatch key={c} name={c} />
          ))}
        </div>
      </Section>

      <Section title="Category tints">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <span
              key={c}
              className="chip !border-transparent font-semibold"
              style={{ color: `var(--cat-${c})`, background: `var(--cat-${c}-subtle)` }}
            >
              Category {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Text on surfaces">
        <div className="grid grid-cols-3 gap-2">
          {["surface", "surface-2", "surface-3"].map((s) => (
            <div key={s} className="rounded-card border border-hairline p-3" style={{ background: `var(--${s})` }}>
              <p className="text-footnote font-semibold text-ink-1">text-1</p>
              <p className="text-footnote text-ink-2">text-2</p>
              <p className="text-footnote text-ink-3">text-3</p>
              <p className="text-footnote text-accent-text">accent-text</p>
              <code className="text-caption text-ink-3">{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale">
        <div className="space-y-2">
          {type.map(([k, label]) => (
            <p key={k} className={k}>
              {label}
            </p>
          ))}
          <p className="text-body tabular">Tabular numbers: €3,000 · ₹1 Lakh · ₹10,000 · 9.06/10 · 1,370</p>
          <p className="app-h2">Small caps label</p>
        </div>
      </Section>

      <Section title="Spacing (4px base)">
        <div className="space-y-1.5">
          {spaces.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="h-3 rounded-sm bg-accent" style={{ width: `var(--space-${s})` }} />
              <code className="text-caption text-ink-3">--space-{s}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-3">
          {radii.map((r) => (
            <div key={r} className="text-center">
              <span
                className="block size-16 border-2 border-accent bg-accent-soft"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <code className="text-caption text-ink-3">{r}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevation">
        <div className="grid grid-cols-2 gap-4 rounded-card bg-panel-2 p-4">
          {shadows.map((s) => (
            <div
              key={s}
              className="grid h-20 place-items-center rounded-card bg-panel text-footnote"
              style={{ boxShadow: `var(--shadow-${s})` }}
            >
              {s}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Materials (over each wallpaper)">
        <div className="grid gap-3">
          {wallpapers.map((w) => (
            <div key={w.id} className="grid grid-cols-3 gap-3 rounded-card p-4" style={{ background: w.background }}>
              {materials.map((m) => (
                <div key={m} className={`material-${m} rounded-card border border-hairline p-3`}>
                  <p className="text-footnote font-semibold">{m}</p>
                  <p className="text-caption text-ink-3">{w.name}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="grid gap-3">
          {[
            ["btn-primary", "Primary"],
            ["btn-secondary", "Secondary"],
            ["btn-ghost", "Ghost"]
          ].map(([cls, label]) => (
            <div key={cls} className="flex flex-wrap items-center gap-2">
              <button type="button" className={cls}>
                {label}
              </button>
              <button
                type="button"
                className={`${cls} ${cls === "btn-primary" ? "!bg-accent-hover" : cls === "btn-secondary" ? "!bg-panel-3" : "!bg-accent-soft"}`}
              >
                Hover
              </button>
              <button type="button" className={`${cls} ${cls === "btn-primary" ? "!bg-accent-active" : ""} scale-[.97]`}>
                Active
              </button>
              <button type="button" className={`${cls} outline outline-2 outline-offset-2 outline-[var(--ring)]`}>
                Focus
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <span className="btn-disabled btn-sm">
              <span className="i-ph:clock" aria-hidden="true" /> Link coming soon
            </span>
            <button type="button" className="btn-primary btn-sm">
              Small
            </button>
            <button type="button" className="btn-primary btn-lg">
              Large
            </button>
          </div>
        </div>
      </Section>

      <Section title="Chips & badges">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">Python</span>
          <span className="chip !border-accent !bg-accent-soft">Matched chip</span>
          <span className="rounded-chip bg-accent px-2.5 py-0.5 text-footnote font-bold text-on-accent">Winner</span>
          <span className="rounded-chip border border-hairline bg-panel px-2.5 py-0.5 text-footnote font-bold tabular">
            €3,000
          </span>
          <span className="rounded-chip bg-panel-3 px-2.5 py-0.5 text-footnote text-ink-2">Team of 4</span>
        </div>
      </Section>

      <Section title="Motion">
        <ul className="space-y-1 text-footnote text-ink-2">
          {Object.entries(duration).map(([k, v]) => (
            <li key={k}>
              <code>{k}</code> — {Math.round(v * 1000)}ms
            </li>
          ))}
          <li>
            <code>--ease-standard</code> / <code>--ease-spring</code>; reduced motion → near-zero durations, fades only
          </li>
        </ul>
      </Section>

      <Section title="App icons">
        <div className="flex flex-wrap gap-3">
          {[...apps.map((a) => a.icon), launchpadIcon].map((icon, i) => (
            <AppIcon key={i} icon={icon} size={48} />
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function Styleguide() {
  useEffect(() => {
    document.title = "Styleguide — Raj Tripathi Portfolio";
    document.body.style.overflow = "auto";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <main className="min-h-full bg-panel-2 p-8">
      <h1 className="text-large font-bold">Design system</h1>
      <p className="mt-1 text-ink-2">
        Tokens live in <code>src/styles/tokens.css</code>. Contrast: <code>node scripts/check-contrast.mjs</code>.
      </p>
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <Board dark={false} />
        <Board dark />
      </div>
    </main>
  );
}
