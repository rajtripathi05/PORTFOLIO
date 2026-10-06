import React, { lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import Boot from "~/pages/Boot";
import { MOBILE_BREAKPOINT, storage } from "~/utils";

import "@fontsource-variable/inter";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
const isQuickView = route === "/quick";
// Route-level code splitting: each route downloads only what it needs.
const Desktop = lazy(() => import("~/pages/Desktop"));
const MobileHome = lazy(() => import("~/pages/MobileHome"));
const Styleguide = lazy(() => import("~/pages/Styleguide"));
const NotFound = lazy(() => import("~/pages/NotFound"));

export default function App() {
  // Returning visitors skip the intro entirely.
  const [booted, setBooted] = useState(() => storage.get("seenIntro") === "1");
  const setRevealed = useStore((s) => s.setRevealed);
  const { winWidth } = useWindowSize();

  useEffect(() => {
    if (booted) setRevealed(true);
  }, [booted]);

  // The shell mounts underneath the boot screen, so it is fully ready when boot fades out.
  return (
    <>
      <Suspense fallback={null}>{winWidth < MOBILE_BREAKPOINT ? <MobileHome /> : <Desktop />}</Suspense>
      {!booted && (
        <Boot
          onDone={() => {
            storage.set("seenIntro", "1");
            setBooted(true);
          }}
        />
      )}
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
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
