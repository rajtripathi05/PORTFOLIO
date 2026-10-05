// Short boot screen: RT monogram + progress bar, max ~1.6s, always skippable.
const BOOT_MS = 1600;

export default function Boot({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const duration = reduced ? 600 : BOOT_MS;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const t = setTimeout(finish, duration);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white flex-center flex-col" role="status">
      <span className="sr-only">Loading Raj Tripathi's portfolio</span>
      <Monogram size={84} framed />
      <div className="mt-10 h-1.5 w-52 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
        <div
          className="h-full rounded-full bg-white boot-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-8 btn btn-sm bg-white/15 text-white hover:bg-white/25 border border-white/25"
      >
        Skip
        <span className="i-ph:arrow-right-bold" aria-hidden="true" />
      </button>
    </div>
  );
}
