import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { apps, type AppDef, type AppId } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import { portfolio } from "~/data/portfolio";
import type { ShellKind } from "~/types";
import AppIcon from "~/components/AppIcon";
import Monogram from "~/components/Monogram";
import { feedback } from "~/sensory/feedback";
import StatusBar from "./StatusBar";
import TouchApp from "./TouchApp";
import TouchOverlays from "./TouchOverlays";
import { openFrom, useInert, useTouchNav } from "./nav";

const DOCK_APPS: AppId[] = ["about", "projects", "achievements", "resume"];
const featured = portfolio.projects[0];

const Launcher = ({ app, dock = false }: { app: AppDef; dock?: boolean }) => (
  <button
    type="button"
    data-tour-id={app.id}
    className="touch-launcher press"
    onClick={(e) => {
      feedback("tap", { el: e.currentTarget });
      openFrom(app.id, e.currentTarget);
    }}
    onPointerEnter={() => void app.load()}
  >
    <AppIcon icon={app.icon} size={dock ? 58 : 62} />
    <span className="touch-launcher-label">{app.shortTitle ?? app.title}</span>
  </button>
);

/** The iOS-style (phone) and iPadOS-style (tablet) home screen, plus the apps opened over it. */
export default function TouchHome({ shell }: { shell: Exclude<ShellKind, "desktop"> }) {
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const wallpaperId = useStore((s) => s.wallpaper);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  useShellSetup();
  const stack = useTouchNav();
  const homeRef = useRef<HTMLDivElement>(null);
  useInert(homeRef, stack.length > 0);

  const wallpaper = getWallpaper(wallpaperId);
  const gridApps = apps.filter((a) => !DOCK_APPS.includes(a.id));
  const dockApps = DOCK_APPS.map((id) => apps.find((a) => a.id === id)!).filter(Boolean);
  const top = stack[stack.length - 1];

  return (
    <div className={`touch-shell touch-shell-${shell}`} style={{ background: wallpaper.background }}>
      <div ref={homeRef} className="touch-home">
        <StatusBar />
        <div className="touch-scroll">
          <header className="touch-header">
            <p className="touch-brand">
              <Monogram size={22} />
              {portfolio.identity.name}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="touch-round material-menubar press"
                onClick={() => {
                  feedback("spotlight");
                  toggleOverlay("spotlight");
                }}
                aria-label="Search"
              >
                <span className="i-ph:magnifying-glass-bold text-[19px]" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="touch-round material-menubar press"
                onClick={(e) => {
                  feedback("toggle", { el: e.currentTarget });
                  toggleDark();
                }}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={dark}
              >
                <span className={`${dark ? "i-ph:sun-bold" : "i-ph:moon-bold"} text-[19px]`} aria-hidden="true" />
              </button>
            </div>
          </header>

          <main className="touch-widgets">
            <a href="/quick" className="touch-widget material-menubar press">
              <div className="flex items-center gap-4">
                <img
                  src={portfolio.identity.photo}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 flex-none rounded-full object-cover ring-2 ring-[var(--photo-ring)]"
                />
                <div className="min-w-0">
                  <p className="text-headline font-bold leading-tight">Hi, I'm {portfolio.identity.firstName} 👋</p>
                  <p className="mt-1 text-body leading-snug text-ink-2">Read my whole portfolio as one simple page.</p>
                </div>
              </div>
              <span className="btn-primary btn-lg mt-4 w-full">
                <span className="i-ph:article-bold" aria-hidden="true" />
                Open Quick View
              </span>
            </a>

            <button
              type="button"
              className="touch-widget material-menubar press text-left"
              onClick={(e) => openFrom("projects", e.currentTarget, { id: featured.id })}
            >
              <p className="app-h2">Featured project</p>
              <p className="mt-1.5 text-callout font-bold">{featured.title}</p>
              {featured.descriptor && <p className="text-body text-ink-2">{featured.descriptor}</p>}
              <p className="mt-2 hstack gap-1 text-body font-semibold text-accent-text">
                See all projects <span className="i-ph:arrow-right-bold" aria-hidden="true" />
              </p>
            </button>
          </main>

          <nav aria-label="Apps" className="touch-grid">
            {gridApps.map((app) => (
              <Launcher key={app.id} app={app} />
            ))}
          </nav>
        </div>

        <nav aria-label="Dock" className="touch-dock material-menubar">
          {dockApps.map((app) => (
            <Launcher key={app.id} app={app} dock />
          ))}
        </nav>
      </div>

      <AnimatePresence>
        {stack.map((id) => {
          const app = apps.find((a) => a.id === id);
          return app ? <TouchApp key={id} app={app} shell={shell} top={id === top} /> : null;
        })}
      </AnimatePresence>
      <TouchOverlays shell={shell} />
    </div>
  );
}
