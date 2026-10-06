import { createPortal } from "react-dom";
import { MenuList, type MenuEntry } from "./Menu";

interface ContextMenuProps {
  x: number;
  y: number;
  ariaLabel: string;
  entries: MenuEntry[];
  onClose: () => void;
}

/** Right-click / long-press menu at the pointer, kept inside the viewport. */
export default function ContextMenu({ x, y, ariaLabel, entries, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  const previous = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);

  useEscape(() => {
    onClose();
    previous.current?.focus?.();
  });
  useClickOutside(ref, onClose);

  useLayoutEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - r.width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - r.height - 8))
    });
  }, [x, y]);

  return createPortal(
    <MenuList
      ref={ref}
      entries={entries}
      ariaLabel={ariaLabel}
      onClose={onClose}
      className="menu-panel !fixed"
      style={{ left: pos.left, top: pos.top, zIndex: 400 }}
    />,
    document.body
  );
}
