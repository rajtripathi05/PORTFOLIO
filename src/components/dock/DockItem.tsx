import type React from "react";
import useRaf from "@rooks/use-raf";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";
import type { IconSpec } from "~/configs/apps";
import { duration, ease, spring } from "~/styles/motion";

// Magnification curve adapted from https://github.com/PuruVJ/macos-web (via Renovamen/playground-macos).
const useDockHoverAnimation = (
  mouseX: MotionValue<number | null>,
  ref: React.RefObject<HTMLDivElement>,
  size: number,
  mag: number
) => {
  const limit = size * 5;
  const input = [-limit, -limit / 2, 0, limit / 2, limit];
  const output = [size, size * (1 + (mag - 1) * 0.45), size * mag, size * (1 + (mag - 1) * 0.45), size];
  const beyond = limit + 1;

  const distance = useMotionValue(beyond);
  const width = useSpring(useTransform(distance, input, output), spring.dock);

  useRaf(() => {
    const el = ref.current;
    const x = mouseX.get();
    if (el && x !== null) {
      const rect = el.getBoundingClientRect();
      distance.set(x - (rect.left + rect.width / 2));
      return;
    }
    distance.set(beyond);
  }, true);

  return width;
};

interface DockItemProps {
  id: string;
  title: string;
  icon: IconSpec;
  isOpen: boolean;
  launches: number;
  mouseX: MotionValue<number | null>;
  magnify: boolean;
  bounce: boolean;
  size: number;
  mag: number;
  hint?: boolean;
  /** Position in the dock, for the staggered reveal. */
  index: number;
  revealed: boolean;
  reduced: boolean;
  onOpen: () => void;
}

export default function DockItem(props: DockItemProps) {
  const { id, title, icon, isOpen, launches, mouseX, magnify, bounce, size, mag, hint, index, revealed, reduced, onOpen } =
    props;
  const ref = useRef<HTMLDivElement>(null);
  const width = useDockHoverAnimation(mouseX, ref, size, mag);
  const controls = useAnimationControls();
  const first = useRef(true);

  // Bounce once each time the app is launched from closed.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (bounce && launches > 0)
      controls.start({ y: [0, -18, 0, -7, 0], transition: { duration: duration.bounce, ease: ease.standard } });
  }, [launches]);

  return (
    <motion.li
      className="relative flex"
      initial={reduced ? false : { y: 14, opacity: 0 }}
      animate={revealed ? { y: 0, opacity: 1 } : undefined}
      transition={{ duration: duration.standard * 1.2, ease: ease.standard, delay: 0.26 + index * 0.015 }}
    >
      {hint && (
        <>
          <span className="dock-hint-tip" role="status">
            Start here
          </span>
          <span className="dock-hint-ring" aria-hidden="true" />
        </>
      )}
      <button
        type="button"
        id={`dock-${id}`}
        className="dock-btn"
        onClick={onOpen}
        aria-label={`Open ${title}`}
        title={title}
      >
        <motion.div
          ref={ref}
          animate={controls}
          style={magnify ? { width, height: width } : { width: size, height: size }}
        >
          <AppIcon icon={icon} size="100%" />
        </motion.div>
        <span className="dock-label" aria-hidden="true">
          {title}
        </span>
        <span className={`dock-dot ${isOpen ? "" : "invisible"}`} aria-hidden="true" />
        {isOpen && <span className="sr-only">(open)</span>}
      </button>
    </motion.li>
  );
}
