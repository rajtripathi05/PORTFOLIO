import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { apps, type AppDef, type AppId } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import type { ShellKind } from "~/types";
import AppIcon from "~/components/AppIcon";
import { feedback } from "~/sensory/feedback";
import { useParallax } from "~/sensory/parallax";
import { NightLights } from "~/features/glass";
import { ArcadeWidget } from "~/features/games/ArcadeWidget";
import { AwardsWidget, FeaturedWidget, ProfileWidget } from "../shared/Widgets";
import StatusBar from "./StatusBar";
import TouchApp from "./TouchApp";
import TouchOverlays from "./TouchOverlays";
import { openFrom, useInert, useTouchNav } from "./nav";

const DOCK_APPS: AppId[] = ["about", "projects", "achievements", "resume"];

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
    aria-label={dock ? app.title : undefined}
  >
    <AppIcon icon={app.icon} size={dock ? 58 : 60} />
    <span className="touch-launcher-label">{app.shortTitle ?? app.title}</span>
  </button>
);

/**
 * The iOS 26-style (phone) and iPadOS-style (tablet) home screen: glass widgets, the app
 * grid, a floating search pill and the glass dock, plus the apps opened over it.
 */
export default function TouchHome({ shell }: { shell: Exclude<ShellKind, "desktop"> }) {
  const wallpaperId = useStore((s) => s.wallpaper);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  useShellSetup();
  const stack = useTouchNav();
  const homeRef = useRef<HTMLDivElement>(null);
  const wallpaperRef = useRef<HTMLDivElement>(null);
  useInert(homeRef, stack.length > 0);
  useParallax(wallpaperRef, { max: 6, source: "tilt" });

  const wallpaper = getWallpaper(wallpaperId);
  const gridApps = apps.filter((a) => !DOCK_APPS.includes(a.id));
  const dockApps = DOCK_APPS.map((id) => apps.find((a) => a.id === id)!).filter(Boolean);
  const top = stack[stack.length - 1];

  return (
    <div className={`touch-shell touch-shell-${shell}`}>
      <div
        ref={wallpaperRef}
        className="absolute -inset-3 will-change-transform"
        style={{ background: wallpaper.background }}
        aria-hidden="true"
      >
        <NightLights wallpaper={wallpaper} />
      </div>
      <div ref={homeRef} className="touch-home">
        <StatusBar />
        <div className="touch-scroll">
          <main className="touch-page">
            <ProfileWidget open={openFrom} />
            <div className="touch-widget-row">
              <AwardsWidget open={openFrom} />
              <ArcadeWidget open={openFrom} />
            </div>
            <nav aria-label="Apps" className="touch-grid">
              {gridApps.map((app) => (
                <Launcher key={app.id} app={app} />
              ))}
            </nav>
            <FeaturedWidget open={openFrom} />
          </main>
        </div>

        <div className="touch-bottom">
          <button
            type="button"
            className="touch-search glass glass-clear glass-lens glass-press"
            onClick={(e) => {
              feedback("spotlight", { el: e.currentTarget });
              toggleOverlay("spotlight");
            }}
          >
            <span className="i-ph:magnifying-glass-bold text-[17px]" aria-hidden="true" />
            Search
          </button>
          <nav aria-label="Dock" className="touch-dock glass glass-clear glass-lens">
            {dockApps.map((app) => (
              <Launcher key={app.id} app={app} dock />
            ))}
          </nav>
        </div>
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
