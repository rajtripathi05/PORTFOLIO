import { lazy, Suspense, type ComponentType } from "react";
import { AnimatePresence } from "framer-motion";
import type { ShellKind } from "~/types";
import { TourLayer } from "~/features/tour";
import ControlCenter from "~/shells/shared/ControlCenter";
import Credits from "~/shells/shared/Credits";
import HelpPanel from "~/shells/shared/HelpPanel";
import OfflineNotice from "~/shells/shared/OfflineNotice";
import Toast from "~/shells/shared/Toast";

type SpotlightProps = { onClose: () => void; shell?: ShellKind };
const Spotlight = lazy(() =>
  import("~/features/spotlight/Spotlight").then((m) => ({ default: m.default as ComponentType<SpotlightProps> }))
);

/** Store-driven overlays shared by the phone and tablet shells. */
export default function TouchOverlays({ shell }: { shell: ShellKind }) {
  const overlay = useStore((s) => s.overlay);
  const setOverlay = useStore((s) => s.setOverlay);
  const close = () => setOverlay(null);

  return (
    <>
      <Suspense fallback={null}>
        <AnimatePresence>
          {overlay === "spotlight" && <Spotlight key="spotlight" onClose={close} shell={shell} />}
          {overlay === "credits" && <Credits key="credits" onClose={close} />}
          {overlay === "help" && <HelpPanel key="help" onClose={close} />}
          {overlay === "control" && <ControlCenter key="control" onClose={close} touch />}
        </AnimatePresence>
      </Suspense>
      <TourLayer />
      <OfflineNotice />
      <Toast />
    </>
  );
}
