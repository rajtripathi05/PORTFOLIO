import type React from "react";
import { motion } from "framer-motion";

/** Score / best / timer chips above a board. */
export function Stats({ items, children }: { items: { label: string; value: React.ReactNode }[]; children?: React.ReactNode }) {
  return (
    <div className="game-stats">
      {items.map((s) => (
        <div key={s.label} className="game-stat">
          <span className="game-stat-label">{s.label}</span>
          <span className="game-stat-value" aria-live={s.label === "Score" ? "polite" : undefined}>
            {s.value}
          </span>
        </div>
      ))}
      {children && <div className="ml-auto flex gap-2">{children}</div>}
    </div>
  );
}

/** A glass card over the board: start, pause and game-over states. */
export function Overlay({
  title,
  body,
  action,
  onAction,
  badge
}: {
  title: string;
  body?: React.ReactNode;
  action?: string;
  onAction?: () => void;
  /** e.g. "New best!" */
  badge?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="game-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      role="status"
    >
      <motion.div
        className="game-overlay-card glass glass-thick"
        initial={reduced ? false : { scale: 0.92, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        {badge && <span className="game-badge">{badge}</span>}
        <p className="text-headline font-bold">{title}</p>
        {body && <div className="mt-1 text-footnote text-ink-2">{body}</div>}
        {action && onAction && (
          <button type="button" className="btn-primary mt-3.5 !rounded-full" onClick={onAction} autoFocus>
            {action}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Small round icon button used in game toolbars. */
export function ToolButton({
  label,
  icon,
  onClick,
  pressed
}: {
  label: string;
  icon: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className={`game-tool glass glass-flat glass-press ${pressed ? "is-on" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
    >
      <span className={`${icon} text-[17px]`} aria-hidden="true" />
    </button>
  );
}

/** Reads design tokens for canvas drawing; re-reads when the theme changes. */
export function useTokenColors<K extends string>(names: readonly K[]): Record<K, string> {
  const dark = useStore((s) => s.dark);
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()])) as Record<K, string>;
  }, [dark]);
}
