import { motion } from "framer-motion";
import { preloadApps } from "~/configs/apps";
import { portfolio } from "~/data/portfolio";
import { duration, ease } from "~/styles/motion";

// Boot screen: RT monogram + a progress bar that tracks real preloading (every app
// chunk and the profile photo). Ends as soon as loading is done — at least 600ms so the
// monogram registers, at most 1.5s — and any click, tap or key skips it.
const MIN_MS = 600;
const MAX_MS = 1500;

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

export default function Boot({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0.08);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setProgress(1);
    setLeaving(true);
  };

  useEffect(() => {
    const started = performance.now();
    let minTimer: ReturnType<typeof setTimeout> | undefined;
    Promise.all([
      preloadApps((p) => setProgress(0.08 + p * 0.82)),
      preloadImage(portfolio.identity.photo)
    ]).then(() => {
      minTimer = setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started)));
    });
    const cap = setTimeout(finish, MAX_MS);
    const onKey = () => finish();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(cap);
      clearTimeout(minTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex-center flex-col bg-[var(--boot-bg)] text-on-media"
      role="status"
      onPointerDown={finish}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: duration.standard, ease: ease.standard }}
      onAnimationComplete={() => leaving && onDone()}
    >
      <span className="sr-only">Loading Raj Tripathi's portfolio</span>
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.emphasis * 1.25, ease: ease.standard }}
      >
        <Monogram size={84} framed />
      </motion.div>
      <div className="mt-10 h-1 w-48 overflow-hidden rounded-chip bg-media-control" aria-hidden="true">
        <div
          className="h-full rounded-chip bg-[var(--on-media)] transition-transform duration-standard ease-standard"
          style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
        />
      </div>
      <button
        type="button"
        onClick={finish}
        className="btn-media btn-sm absolute bottom-8 right-8 border border-media-control-hover"
      >
        Skip
        <span className="i-ph:arrow-right-bold" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
