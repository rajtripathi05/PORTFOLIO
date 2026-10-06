import { motion } from "framer-motion";
import { apps } from "~/configs/apps";
import { fade } from "~/styles/motion";

export default function Launchpad({ onClose }: { onClose: () => void }) {
  const openApp = useStore((s) => s.openApp);
  const reduced = useReducedMotion();
  const firstRef = useRef<HTMLButtonElement>(null);

  useEscape(onClose);
  useEffect(() => firstRef.current?.focus(), []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="All apps"
      className="fixed inset-0 z-[140] flex items-center justify-center bg-scrim px-6 backdrop-blur-2xl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.06 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0, pointerEvents: "none" } : { opacity: 0, scale: 1.06, pointerEvents: "none" }}
      transition={fade}
    >
      <ul
        className="grid max-w-[880px] grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-5"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        {apps.map((app, i) => (
          <li key={app.id} className="flex justify-center">
            <button
              ref={i === 0 ? firstRef : undefined}
              data-tour-id={app.id}
              type="button"
              className="flex w-28 flex-col items-center gap-2 rounded-panel p-2 text-on-media transition-transform active:scale-95"
              onClick={() => {
                onClose();
                openApp(app.id);
              }}
            >
              <AppIcon icon={app.icon} size={76} />
              <span className="text-body font-medium label-on-media">{app.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
