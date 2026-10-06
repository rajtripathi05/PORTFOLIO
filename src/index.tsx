import React, { lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { resolveShell, useShellKind } from "~/shells/device";
import { initSensory } from "~/sensory";
import { TourLayer } from "~/features/tour";
import { storage } from "~/utils/storage";

import "@fontsource-variable/inter";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
const isQuickView = route === "/quick";

// Each shell is its own chunk, so a phone never downloads the window manager.
const DesktopShell = lazy(() => import("~/shells/DesktopShell"));
const TabletShell = lazy(() => import("~/shells/TabletShell"));
const PhoneShell = lazy(() => import("~/shells/PhoneShell"));
const Boot = lazy(() => import("~/shells/desktop/Boot"));
const Styleguide = lazy(() => import("~/pages/Styleguide"));
const NotFound = lazy(() => import("~/pages/NotFound"));

export default function App() {
  const viewAs = useStore((s) => s.viewAs);
  const shell = useShellKind(viewAs);
  const setRevealed = useStore((s) => s.setRevealed);
  // The boot screen plays once, on a first visit that lands on the desktop shell.
  const [booting, setBooting] = useState(
    () => storage.get("seenIntro") !== "1" && resolveShell(useStore.getState().viewAs) === "desktop"
  );
  const showBoot = booting && shell === "desktop";

  useLayoutEffect(() => {
    document.documentElement.dataset.shell = shell;
  }, [shell]);

  useEffect(() => {
    if (!showBoot) setRevealed(true);
  }, [showBoot]);

  const finishBoot = () => {
    storage.set("seenIntro", "1");
    setBooting(false);
  };

  // The shell mounts underneath the boot screen, so it is ready when boot fades out.
  return (
    <>
      <Suspense fallback={null}>
        {shell === "desktop" ? <DesktopShell /> : shell === "tablet" ? <TabletShell /> : <PhoneShell />}
      </Suspense>
      {showBoot && (
        <Suspense fallback={<div className="fixed inset-0 z-[500] bg-[var(--boot-bg)]" aria-hidden="true" />}>
          <Boot onDone={finishBoot} />
        </Suspense>
      )}
      <TourLayer />
    </>
  );
}

const rootElement = document.getElementById("root") as HTMLElement;

if (isQuickView) {
  document.documentElement.classList.add("is-quick");
  // The build pre-renders Quick View into the HTML; hydrate it once its code arrives.
  import("~/pages/QuickView").then(({ default: QuickView }) => {
    const app = (
      <React.StrictMode>
        <QuickView />
      </React.StrictMode>
    );
    if (rootElement.hasChildNodes()) hydrateRoot(rootElement, app);
    else createRoot(rootElement).render(app);
  });
} else if (!["/", "/index.html", "/styleguide"].includes(route)) {
  createRoot(rootElement).render(
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  );
} else if (route === "/styleguide") {
  createRoot(rootElement).render(
    <Suspense fallback={null}>
      <Styleguide />
    </Suspense>
  );
} else {
  initSensory();
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
