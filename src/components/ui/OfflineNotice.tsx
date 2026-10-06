import { AnimatePresence, motion } from "framer-motion";
import { duration, ease } from "~/styles/motion";

/** Shows a small notice while the visitor is offline, and a brief "Back online" toast after. */
export default function OfflineNotice() {
  // `!== false`: Node (pre-rendering) has a navigator without onLine — treat unknown as online.
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const off = () => setOnline(false);
    const on = () => {
      setOnline(true);
      setJustBack(true);
      clearTimeout(t);
      t = setTimeout(() => setJustBack(false), 2500);
    };
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
      clearTimeout(t);
    };
  }, []);

  const text = !online ? "You're offline — some live sites won't load" : justBack ? "Back online" : null;

  return (
    <div role="status" aria-live="polite">
      <AnimatePresence>
        {text && (
          <motion.div
            key={text}
            className="toast !bottom-auto"
            style={{ top: "calc(var(--space-12) + env(safe-area-inset-top))" }}
            initial={{ opacity: 0, y: -8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -8, x: "-50%" }}
            transition={{ duration: duration.standard, ease: ease.standard }}
          >
            <span className={online ? "i-ph:wifi-high-bold" : "i-ph:wifi-slash-bold"} aria-hidden="true" />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
