import { motion, useMotionValue } from "framer-motion";
import { duration, ease } from "~/styles/motion";
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
  const revealed = useStore((s) => s.revealed);

  const mouseX = useMotionValue<number | null>(null);
  const magnify = !reduced && !isTouchDevice();
  // Shrink icons on narrower desktops so every labelled icon still fits.
  const size = winWidth < 1000 ? 38 : winWidth < 1200 ? 44 : 48;
  const mag = 1.55;

  return (
    <motion.nav
      aria-label="Dock"
      className="fixed inset-x-0 bottom-2 z-30 flex justify-center px-2"
      initial={reduced ? { opacity: 0 } : { y: 110 }}
      animate={revealed ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: duration.emphasis, ease: ease.standard, delay: 0.2 }}
    >
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
          index={0}
          revealed={revealed}
          reduced={reduced}
        />
        <li className="dock-sep" aria-hidden="true" />
        {apps.map((app, i) => (
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
            index={i + 1}
            revealed={revealed}
            reduced={reduced}
            onOpen={() => {
              setOverlay(null);
              openApp(app.id);
            }}
          />
        ))}
      </ul>
    </motion.nav>
  );
}
