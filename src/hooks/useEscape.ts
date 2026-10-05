// A stack of Escape handlers: the most recently mounted active handler wins,
// so a lightbox closes before its window, and a menu before the desktop.
const stack: { current: () => void }[] = [];

let listening = false;
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== "Escape" || stack.length === 0) return;
  e.preventDefault();
  stack[stack.length - 1].current();
};

export function useEscape(handler: () => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!active) return;
    const entry = { current: () => ref.current() };
    stack.push(entry);
    if (!listening) {
      window.addEventListener("keydown", onKeyDown);
      listening = true;
    }
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}

/** True while a menu, dialog or lightbox has registered its own Escape handler. */
export const hasEscapeHandlers = (): boolean => stack.length > 0;
