import { AnimatePresence, motion } from "framer-motion";
import { copyText } from "~/utils";
import { feedback } from "~/sensory/feedback";
import { duration, ease } from "~/styles/motion";

interface CopyButtonProps {
  text: string;
  label: string;
  /** Screen-reader confirmation, e.g. "Link copied". */
  copiedLabel?: string;
  icon?: string;
  className?: string;
}

/** Copies text and swaps its label for an animated "Copied ✓" for 1.8s. */
export default function CopyButton({
  text,
  label,
  copiedLabel = "Copied",
  icon = "i-ph:link-bold",
  className = "btn-secondary btn-sm"
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const reduced = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    const ok = await copyText(text);
    setState(ok ? "copied" : "failed");
    feedback(ok ? "success" : "error", { el: btn.current });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1800);
  };

  const content =
    state === "copied"
      ? { key: "copied", icon: "", text: "Copied ✓" }
      : state === "failed"
        ? { key: "failed", icon: "i-ph:warning-bold", text: "Copy failed" }
        : { key: "idle", icon, text: label };

  return (
    <button ref={btn} type="button" className={`${className} min-w-[7.5rem]`} onClick={onClick}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={content.key}
          className="inline-flex items-center gap-2"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: duration.micro, ease: ease.standard }}
        >
          {content.icon && <span className={content.icon} aria-hidden="true" />}
          {content.text}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? copiedLabel : ""}
      </span>
    </button>
  );
}
