import type React from "react";

export type MenuEntry =
  | { type: "item"; label: string; hint?: string; checked?: boolean; toggle?: boolean; onSelect: () => void }
  | { type: "sep" }
  | { type: "heading"; label: string };

const focusables = (el: HTMLElement | null) =>
  Array.from(el?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? []);

interface MenuListProps {
  entries: MenuEntry[];
  ariaLabel: string;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Keyboard-navigable menu (arrows, Home/End, Enter, Tab closes). Shared by menu-bar and context menus. */
export const MenuList = forwardRef<HTMLDivElement, MenuListProps>(function MenuList(
  { entries, ariaLabel, onClose, className = "menu-panel", style },
  ref
) {
  const listRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => listRef.current as HTMLDivElement);
  const hasChecks = entries.some((e) => e.type === "item" && e.checked !== undefined);

  useEffect(() => {
    focusables(listRef.current)[0]?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = focusables(listRef.current);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(items.length - 1);
    else if (e.key === "Tab") onClose();
  };

  return (
    <div
      ref={listRef}
      role="menu"
      aria-label={ariaLabel}
      className={`${className} material-popover`}
      style={style}
      onKeyDown={onKeyDown}
    >
      {entries.map((entry, i) => {
        if (entry.type === "sep") return <div key={i} role="separator" className="menu-sep" />;
        if (entry.type === "heading")
          return (
            <div key={i} role="presentation" className="menu-heading">
              {entry.label}
            </div>
          );
        const checkable = entry.checked !== undefined;
        return (
          <button
            key={i}
            type="button"
            data-menu-item
            role={entry.toggle ? "menuitemcheckbox" : checkable ? "menuitemradio" : "menuitem"}
            aria-checked={checkable ? entry.checked : undefined}
            tabIndex={-1}
            className="menu-item"
            onClick={() => {
              onClose();
              entry.onSelect();
            }}
          >
            {hasChecks && (
              <span className="w-4 flex-none" aria-hidden="true">
                {entry.checked && <span className="i-ph:check-bold text-[13px]" />}
              </span>
            )}
            <span>{entry.label}</span>
            {entry.hint && <span className="menu-hint">{entry.hint}</span>}
          </button>
        );
      })}
    </div>
  );
});

interface MenuProps {
  id: string;
  label: React.ReactNode;
  ariaLabel: string;
  entries: MenuEntry[];
  buttonClassName?: string;
}

/** Menu-bar menu: opens on click, then follows hover while any menu is open (like macOS). */
export default function Menu({ id, label, ariaLabel, entries, buttonClassName = "" }: MenuProps) {
  const openMenu = useStore((s) => s.openMenu);
  const setOpenMenu = useStore((s) => s.setOpenMenu);
  const open = openMenu === id;

  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useClickOutside(rootRef, () => {
    if (useStore.getState().openMenu === id) setOpenMenu(null);
  });
  useEscape(() => {
    setOpenMenu(null);
    btnRef.current?.focus();
  }, open);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        className={`menubar-btn ${buttonClassName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpenMenu(open ? null : id)}
        onMouseEnter={() => {
          if (openMenu && openMenu !== id) setOpenMenu(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpenMenu(id);
          }
        }}
      >
        {label}
      </button>
      {open && <MenuList entries={entries} ariaLabel={ariaLabel} onClose={() => setOpenMenu(null)} />}
    </div>
  );
}
