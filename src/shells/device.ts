import type { ShellKind, ViewAs } from "~/types";

const matches = (q: string) => typeof window !== "undefined" && !!window.matchMedia?.(q).matches;

/** iPads in desktop mode report themselves as a Mac but have multi-touch. */
const isTouchMac = () =>
  typeof navigator !== "undefined" && /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;

/** True when the primary input is a finger. */
export const isCoarsePointer = (): boolean =>
  matches("(pointer: coarse)") || matches("(hover: none)") || isTouchMac();

/**
 * Picks the shell for the current viewport:
 * - phone: width < 768 (and touch devices whose short side is phone-sized, so a
 *   rotated phone stays a phone);
 * - desktop: width ≥ 1280, or width ≥ 1024 with a fine pointer;
 * - tablet: everything in between.
 */
export const detectShell = (w = window.innerWidth, h = window.innerHeight): ShellKind => {
  const coarse = isCoarsePointer();
  if (w < 768 || (coarse && Math.min(w, h) < 600)) return "phone";
  if (w >= 1280) return "desktop";
  if (coarse) return "tablet";
  return w >= 1024 ? "desktop" : "tablet";
};

export const resolveShell = (viewAs: ViewAs): ShellKind => (viewAs === "auto" ? detectShell() : viewAs);

/** The active shell; re-evaluated (debounced) on resize and rotation. */
export function useShellKind(viewAs: ViewAs): ShellKind {
  const [shell, setShell] = useState<ShellKind>(() => resolveShell(viewAs));

  useEffect(() => {
    setShell(resolveShell(viewAs));
    if (viewAs !== "auto") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShell(detectShell()), 150);
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [viewAs]);

  return shell;
}
