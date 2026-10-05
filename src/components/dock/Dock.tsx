import { useMotionValue } from "framer-motion";
import { apps, launchpadIcon } from "~/configs/apps";
import { isTouchDevice } from "~/utils";

export default function Dock() {
  const windows = useStore((s) => s.windows);
  const openApp = useStore((s) => s.openApp);
  const toggleOverlay = useStore((s) => s.toggleOverlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const overlay = useStore((s) => s.overlay);
  const dockHint = useStore((s) => s.dockHint);
  const { winWidth } = useWindowSize();
  const reduced = useReducedMotion();

  const mouseX = useMotionValue<number | null>(null);
  const magnify = !reduced && !isTouchDevice();
  // Shrink icons on narrower desktops so every labelled icon still fits.
  const size = winWidth < 1000 ? 38 : winWidth < 1200 ? 44 : 48;
  const mag = 1.55;

  return (
    <nav aria-label="Dock" className="fixed inset-x-0 bottom-2 z-30 flex justify-center px-2">
      <ul
        className="dock-bar material-menubar max-w-full"
        onMouseMove={(e) => magnify && mouseX.set(e.nativeEvent.x)}
        onMouseLeave={() => mouseX.set(null)}
      >
        <DockItem
          id="launchpad"
          title="Launchpad"
          icon={launchpadIcon}
          isOpen={overlay === "launchpad"}
          launches={0}
          mouseX={mouseX}
          magnify={magnify}
          bounce={false}
          size={size}
          mag={mag}
          onOpen={() => toggleOverlay("launchpad")}
        />
        <li className="dock-sep" aria-hidden="true" />
        {apps.map((app) => (
          <DockItem
            key={app.id}
            id={app.id}
            title={app.title}
            icon={app.icon}
            isOpen={!!windows[app.id]?.open}
            launches={windows[app.id]?.launches ?? 0}
            mouseX={mouseX}
            magnify={magnify}
            bounce={!reduced}
            size={size}
            mag={mag}
            hint={dockHint === app.id}
            onOpen={() => {
              setOverlay(null);
              openApp(app.id);
            }}
          />
        ))}
      </ul>
    </nav>
  );
}
