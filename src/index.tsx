import React, { lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import Desktop from "~/pages/Desktop";
import Boot from "~/pages/Boot";
import MobileHome from "~/pages/MobileHome";
import QuickView from "~/pages/QuickView";
import { MOBILE_BREAKPOINT, storage } from "~/utils";

import "@fontsource-variable/inter";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
const isQuickView = route === "/quick";
const Styleguide = lazy(() => import("~/pages/Styleguide"));

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
      {winWidth < MOBILE_BREAKPOINT ? <MobileHome /> : <Desktop />}
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
  const app = (
    <React.StrictMode>
      <QuickView />
    </React.StrictMode>
  );
  // The build pre-renders Quick View into the HTML; hydrate it when present.
  if (rootElement.hasChildNodes()) hydrateRoot(rootElement, app);
  else createRoot(rootElement).render(app);
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
