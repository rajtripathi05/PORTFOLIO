import type React from "react";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { groupOrder, search, searchIndex, suggestedKeys, type SearchItem } from "~/lib/search";
import { shortcutLabel } from "~/utils";

export default function Spotlight({ onClose }: { onClose: () => void }) {
  const openApp = useStore((s) => s.openApp);
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEscape(onClose);
  useEffect(() => inputRef.current?.focus(), []);

  const results: SearchItem[] = useMemo(() => {
    if (!query.trim())
      return suggestedKeys.map((k) => searchIndex.find((i) => i.key === k)!).filter(Boolean);
    const found = search(query);
    // Keep groups together in a stable order, max 6 per group.
    return groupOrder.flatMap((g) => found.filter((i) => i.group === g).slice(0, 6));
  }, [query]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const launch = (item?: SearchItem) => {
    if (!item) return;
    onClose();
    openApp(item.app, item.payload);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      launch(results[active]);
    }
  };

  let lastGroup = "";

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex justify-center bg-black/10 px-4 pt-[14vh] dark:bg-black/30"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="glass-menu h-max w-full max-w-[640px] overflow-hidden rounded-2xl border border-hairline shadow-2xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
      >
        <div className="flex items-center gap-3 px-5">
          <span className="i-ph:magnifying-glass-bold text-[22px] text-ink-3" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="spotlight-results"
            aria-activedescendant={results[active] ? `spot-${results[active].key}` : undefined}
            aria-label="Search projects, achievements, experience and skills"
            placeholder="Search projects, awards, skills…"
            className="h-16 min-w-0 flex-1 bg-transparent text-[21px] text-ink-1 outline-none placeholder:text-ink-3 focus-visible:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="hidden rounded-md border border-hairline px-2 py-0.5 font-mono text-[11.5px] text-ink-3 sm:block">
            {shortcutLabel("K")}
          </kbd>
        </div>

        <ul
          ref={listRef}
          id="spotlight-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[52vh] overflow-y-auto border-t border-hairline p-2"
        >
          {!query.trim() && <li className="app-h2 px-3 pb-1 pt-2">Suggested</li>}
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-ink-2">
              No matches for “{query}”. Try “projects”, “AI” or “award”.
            </li>
          )}
          {results.map((item, i) => {
            const header = query.trim() && item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const selected = i === active;
            return (
              <Fragment key={item.key}>
                {header && (
                  <li role="presentation" className="app-h2 px-3 pb-1 pt-3">
                    {header}
                  </li>
                )}
                <li
                  id={`spot-${item.key}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(i)}
                  onClick={() => launch(item)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                    selected ? "bg-accent text-white" : "text-ink-1"
                  }`}
                >
                  <span
                    className={`${item.icon} flex-none text-[20px] ${selected ? "text-white" : "text-accent-text"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                    {item.subtitle && (
                      <span className={`block truncate text-[13px] ${selected ? "text-white/85" : "text-ink-3"}`}>
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <span className="flex-none text-[12px] text-white/85" aria-hidden="true">
                      ↵ Open
                    </span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}
