import type React from "react";

/**
 * Remembers what had focus when a window/panel/sheet opened and gives focus back
 * to it when that surface closes (falling back to `fallbackSelector`, e.g. the
 * app's dock icon), so keyboard and screen-reader users never get dropped on <body>.
 */
export function useReturnFocus(containerRef: React.RefObject<HTMLElement>, fallbackSelector?: string) {
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null)
  );

  useEffect(
    () => () => {
      const active = document.activeElement;
      const lostFocus = !active || active === document.body || containerRef.current?.contains(active);
      if (!lostFocus) return;
      // Wait a frame: the surface is being removed (after its exit animation).
      requestAnimationFrame(() => {
        const target =
          opener && opener.isConnected && opener !== document.body
            ? opener
            : fallbackSelector
              ? document.querySelector<HTMLElement>(fallbackSelector)
              : null;
        target?.focus({ preventScroll: true });
      });
    },
    []
  );
}
