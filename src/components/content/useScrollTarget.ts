import type React from "react";
import { useAppHost } from "~/shells/host";

/**
 * Opening an app with `{ id }` (deep link, Spotlight, AI) scrolls to that item and
 * highlights it briefly. `onTarget` runs first (e.g. to expand a collapsed section).
 * Returns the id currently highlighted.
 */
export function useScrollTarget(
  rootRef: React.RefObject<HTMLElement>,
  domId: (id: string) => string,
  onTarget?: (id: string) => void
): string | null {
  const { params, nonce } = useAppHost();
  const reduced = useReducedMotion();
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (typeof id !== "string" || !id) return;
    onTarget?.(id);
    const t = setTimeout(() => {
      const el = rootRef.current?.querySelector(`[id="${domId(id).replace(/"/g, "")}"]`);
      el?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      if (el) setHighlight(id);
    }, 150);
    const t2 = setTimeout(() => setHighlight(null), 2400);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  return highlight;
}
