import { AnimatePresence } from "framer-motion";
import { apps, type AppDef, type AppId } from "~/configs/apps";
import { getWallpaper } from "~/configs/wallpapers";
import { portfolio } from "~/data/portfolio";
import { hasEscapeHandlers } from "~/hooks/useEscape";

const DOCK_APPS: AppId[] = ["about", "projects", "achievements", "resume"];
const featured = portfolio.projects[0];

const HomeIcon = ({ app, onOpen, dock = false }: { app: AppDef; onOpen: () => void; dock?: boolean }) => (
  <button
    type="button"
    onClick={onOpen}
    className="flex min-h-[44px] flex-col items-center gap-1.5 rounded-panel p-1 transition-transform active:scale-[.92]"
  >
    <AppIcon icon={app.icon} size={dock ? 58 : 62} />
    <span className="max-w-[96px] truncate text-footnote font-medium tracking-[-0.01em] text-ink-1">{app.title}</span>
  </button>
);

export default function MobileHome() {
  const windows = useStore((s) => s.windows);
  const focusedId = useStore((s) => s.focusedId);
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const wallpaperId = useStore((s) => s.wallpaper);
  const openApp = useStore((s) => s.openApp);
  const closeFocused = useStore((s) => s.closeFocused);
  useShellSetup();

  const wallpaper = getWallpaper(wallpaperId);
  const gridApps = apps.filter((a) => !DOCK_APPS.includes(a.id));
  const dockApps = DOCK_APPS.map((id) => apps.find((a) => a.id === id)!);
  const top = focusedId && windows[focusedId]?.open ? apps.find((a) => a.id === focusedId) : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && !hasEscapeHandlers()) closeFocused();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper.background }}>
      <div
        className="h-full overflow-y-auto"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 120px)",
          paddingLeft: "max(16px, env(safe-area-inset-left))",
          paddingRight: "max(16px, env(safe-area-inset-right))"
        }}
        aria-hidden={top ? true : undefined}
      >
        <header className="mx-auto flex max-w-[560px] items-center justify-between">
          <p className="hstack gap-2 text-callout font-bold">
            <Monogram size={22} />
            {portfolio.identity.name}
          </p>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full material-menubar active:scale-[.96]"
            onClick={toggleDark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={`${dark ? "i-ph:sun-bold" : "i-ph:moon-bold"} text-[19px]`} />
          </button>
        </header>

        <main className="home mx-auto mt-4 max-w-[560px]">
          <a
            href="/quick"
            className="home-widget material-menubar block rounded-panel border border-hairline p-5 shadow-raised transition-transform active:scale-[.98]"
          >
            <div className="flex items-center gap-4">
              <img
                src={portfolio.identity.photo}
                alt=""
                width={64}
                height={64}
                className="home-photo size-16 flex-none rounded-full object-cover ring-2 ring-[var(--photo-ring)]"
              />
              <div className="min-w-0">
                <p className="text-headline font-bold leading-tight">Hi, I'm {portfolio.identity.firstName} 👋</p>
                <p className="mt-1 text-body leading-snug text-ink-2">
                  Read my whole portfolio as one simple page.
                </p>
              </div>
            </div>
            <span className="home-cta btn-primary btn-lg mt-4 w-full">
              <span className="i-ph:article-bold" aria-hidden="true" />
              Open Quick View
            </span>
          </a>

          <button
            type="button"
            onClick={() => openApp("projects", { id: featured.id })}
            className="home-widget home-featured material-menubar mt-3 block w-full rounded-panel border border-hairline p-4 text-left shadow-raised transition-transform active:scale-[.98]"
          >
            <p className="app-h2">Featured project</p>
            <p className="mt-1.5 text-callout font-bold">{featured.title}</p>
            {featured.descriptor && <p className="text-body text-ink-2">{featured.descriptor}</p>}
            <p className="mt-2 hstack gap-1 text-body font-semibold text-accent-text">
              See all projects <span className="i-ph:arrow-right-bold" aria-hidden="true" />
            </p>
          </button>

          <nav aria-label="Apps" className="home-grid mt-6 grid grid-cols-4 gap-x-2 gap-y-5">
            {gridApps.map((app) => (
              <HomeIcon key={app.id} app={app} onOpen={() => openApp(app.id)} />
            ))}
          </nav>
        </main>
      </div>

      <nav
        aria-label="Dock"
        className="material-menubar fixed inset-x-3 mx-auto flex max-w-[560px] justify-around rounded-panel border border-hairline px-2 py-2.5 shadow-overlay"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        aria-hidden={top ? true : undefined}
      >
        {dockApps.map((app) => (
          <HomeIcon key={app.id} app={app} dock onOpen={() => openApp(app.id)} />
        ))}
      </nav>

      <AnimatePresence>{top && <MobileSheet key={top.id} app={top} />}</AnimatePresence>
      <OfflineNotice />
      <Toast />
    </div>
  );
}
