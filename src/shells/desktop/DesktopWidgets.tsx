import { motion } from "framer-motion";
import { ArcadeWidget } from "~/features/games/ArcadeWidget";
import { duration, ease } from "~/styles/motion";
import { DOCK_RESERVE, MENU_BAR_HEIGHT } from "~/utils";
import { AwardsWidget, FeaturedWidget, ProfileWidget, StatsWidget, type OpenFrom } from "../shared/Widgets";

/** Rough heights, to show only the widgets that fit above the dock. */
const PROFILE = 180;
const ROW = 150;
const FEATURED = 180;
const STATS = 150;
const GAP = 12;

/** macOS Tahoe-style desktop widgets in a glass column on the left. Windows open above them. */
export default function DesktopWidgets() {
  const openApp = useStore((s) => s.openApp);
  const revealed = useStore((s) => s.revealed);
  const reduced = useReducedMotion();
  const { winHeight } = useWindowSize();
  const open: OpenFrom = (id, _el, params) => openApp(id, params);

  const avail = winHeight - MENU_BAR_HEIGHT - DOCK_RESERVE - 28;
  const showRow = avail >= PROFILE + GAP + ROW;
  const showFeatured = showRow && avail >= PROFILE + ROW + FEATURED + GAP * 2;
  const showStats = showFeatured && avail >= PROFILE + ROW + FEATURED + STATS + GAP * 3;

  return (
    <motion.aside
      aria-label="Widgets"
      className="desktop-widgets"
      style={{ top: MENU_BAR_HEIGHT + 14 }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
      animate={revealed ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: duration.emphasis, ease: ease.standard, delay: 0.32 }}
    >
      <ProfileWidget open={open} />
      {showRow && (
        <div className="grid grid-cols-2 gap-3">
          <AwardsWidget open={open} />
          <ArcadeWidget open={open} />
        </div>
      )}
      {showFeatured && <FeaturedWidget open={open} />}
      {showStats && <StatsWidget open={open} />}
    </motion.aside>
  );
}
