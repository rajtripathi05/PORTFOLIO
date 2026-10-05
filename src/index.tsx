import React from "react";
import { createRoot } from "react-dom/client";
import Desktop from "~/pages/Desktop";
import Boot from "~/pages/Boot";
import { storage } from "~/utils";

import "@fontsource-variable/inter";
import "@unocss/reset/tailwind.css";
import "uno.css";
import "~/styles/index.css";

export default function App() {
  // Returning visitors skip the intro entirely.
  const [booted, setBooted] = useState(() => storage.get("seenIntro") === "1");

  if (!booted)
    return (
      <Boot
        onDone={() => {
          storage.set("seenIntro", "1");
          setBooted(true);
        }}
      />
    );

  return <Desktop />;
}

const rootElement = document.getElementById("root") as HTMLElement;
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
