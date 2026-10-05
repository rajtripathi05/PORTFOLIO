import React from "react";
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

const isQuickView = window.location.pathname.replace(/\/+$/, "") === "/quick";

export default function App() {
  // Returning visitors skip the intro entirely.
  const [booted, setBooted] = useState(() => storage.get("seenIntro") === "1");
  const { winWidth } = useWindowSize();

  if (!booted)
    return (
      <Boot
        onDone={() => {
          storage.set("seenIntro", "1");
          setBooted(true);
        }}
      />
    );

  return winWidth < MOBILE_BREAKPOINT ? <MobileHome /> : <Desktop />;
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
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
