import type React from "react";
import { motion } from "framer-motion";

interface DialogProps {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  /** Optional element to focus first (defaults to the first focusable). */
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/** Modal dialog: focus trap, Escape, click-outside, and focus returns to the trigger. */
export default function Dialog({ label, onClose, children, width = 480, initialFocus, className = "" }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEscape(onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = initialFocus?.current ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? ref.current)?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/25 p-4 dark:bg-black/45"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`glass-menu max-h-[calc(100vh-32px)] w-full overflow-y-auto rounded-2xl border border-hairline shadow-2xl ${className}`}
        style={{ maxWidth: width }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
