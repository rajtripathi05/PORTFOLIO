import type React from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "~/data/media";
import { isTouchDevice } from "~/utils";

interface LightboxProps {
  title: string;
  items: MediaItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const formatDuration = (s?: number) =>
  s === undefined ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const FOCUSABLE = 'a[href], button:not([disabled]), video, iframe, [tabindex]:not([tabindex="-1"])';
const MAX_ZOOM = 4;

/** Image with pinch-to-zoom, double-tap / double-click zoom and drag-to-pan while zoomed. */
function ZoomableImage({
  item,
  alt,
  onZoomChange
}: {
  item: MediaItem;
  alt: string;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number; x: number; y: number; px: number; py: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(() => onZoomChange(view.scale > 1.01), [view.scale > 1.01]);

  const toggleZoom = () => setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }));

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      gesture.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        scale: view.scale,
        x: view.x,
        y: view.y,
        px: 0,
        py: 0
      };
    } else if (pts.length === 1) {
      gesture.current = { dist: 0, scale: view.scale, x: view.x, y: view.y, px: e.clientX, py: e.clientY };
      if (e.pointerType === "touch") {
        const now = Date.now();
        if (now - lastTap.current < 300) toggleZoom();
        lastTap.current = now;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length === 2 && g.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = Math.min(MAX_ZOOM, Math.max(1, (g.scale * dist) / g.dist));
      setView((v) => ({ ...v, scale, ...(scale === 1 ? { x: 0, y: 0 } : {}) }));
    } else if (pts.length === 1 && view.scale > 1) {
      setView((v) => ({ ...v, x: g.x + (e.clientX - g.px), y: g.y + (e.clientY - g.py) }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
  };

  return (
    <div
      className="relative flex size-full items-center justify-center overflow-hidden"
      style={{ touchAction: "none", cursor: view.scale > 1 ? "grab" : "zoom-in" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={toggleZoom}
    >
      <img
        src={item.src}
        alt={alt}
        width={item.width}
        height={item.height}
        draggable={false}
        className="max-h-full max-w-full select-none rounded-sm object-contain transition-transform duration-micro ease-standard"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          backgroundImage: item.blur ? `url(${item.blur})` : undefined,
          backgroundSize: "cover"
        }}
      />
    </div>
  );
}

/** Poster frame with a custom play button; the video only loads/plays after a click (never autoplays on open). */
function VideoPlayer({ item, label }: { item: MediaItem; label: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing)
    return (
      <video
        src={item.src}
        poster={item.poster}
        controls
        autoPlay
        playsInline
        className="max-h-full max-w-full rounded-sm bg-[var(--media-bg)]"
        aria-label={label}
      />
    );
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative max-h-full overflow-hidden rounded-sm"
      aria-label={`Play video: ${label}`}
    >
      <img
        src={item.poster}
        alt=""
        width={item.width}
        height={item.height}
        className="max-h-[calc(100vh-220px)] max-w-full object-contain"
        style={{ backgroundImage: item.blur ? `url(${item.blur})` : undefined, backgroundSize: "cover" }}
      />
      <span className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-media-chip text-on-media shadow-overlay backdrop-blur-md transition-transform duration-micro ease-standard group-hover:scale-105">
        <span className="i-ph:play-fill ml-1 text-[34px]" aria-hidden="true" />
      </span>
      {item.duration !== undefined && (
        <span className="absolute bottom-3 right-3 rounded-sm bg-media-chip px-2 py-0.5 text-footnote font-semibold tabular text-on-media">
          {formatDuration(item.duration)}
        </span>
      )}
    </button>
  );
}

export default function Lightbox({ title, items, index, onIndex, onClose }: LightboxProps) {
  const item = items[index];
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const many = items.length > 1;

  const go = (delta: number) => {
    setZoomed(false);
    onIndex((index + delta + items.length) % items.length);
  };

  useEscape(onClose);

  // Focus the dialog on open; give focus back to whatever opened it on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && many) go(1);
      else if (e.key === "ArrowLeft" && many) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, many]);

  // Keep Tab inside the viewer.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !rootRef.current) return;
    const nodes = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Swipe left/right to change photo (only when not zoomed in).
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || !many || zoomed) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1);
  };

  const label = `${title} — ${item.name}`;
  const arrow =
    "absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-media-control text-on-media backdrop-blur hover:bg-media-control-hover";

  return createPortal(
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col bg-scrim-strong text-on-media backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — media viewer`}
      onKeyDown={onKeyDown}
    >
      <div className="flex flex-none items-center gap-3 px-4 py-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <p className="min-w-0 flex-1 truncate text-body">
          <span className="font-semibold">{title}</span>
          <span className="text-on-media opacity-80"> — {item.name}</span>
        </p>
        {many && (
          <span className="text-footnote tabular text-on-media opacity-80" aria-live="polite">
            {index + 1} of {items.length}
          </span>
        )}
        <a href={item.src} target="_blank" rel="noopener noreferrer" className="btn-media btn-sm">
          Open original <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-media-control hover:bg-media-control-hover"
          aria-label="Close viewer (Esc)"
        >
          <span className="i-ph:x-bold text-[18px]" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {many && !zoomed && (
          <button type="button" className={`${arrow} left-3`} onClick={() => go(-1)} aria-label="Previous">
            <span className="i-ph:caret-left-bold text-[22px]" />
          </button>
        )}

        {item.type === "image" && <ZoomableImage key={item.src} item={item} alt={label} onZoomChange={setZoomed} />}
        {item.type === "video" && <VideoPlayer key={item.src} item={item} label={label} />}
        {item.type === "pdf" &&
          (isTouchDevice() ? (
            <div className="text-center">
              <span className="i-ph:file-pdf-duotone text-[72px]" aria-hidden="true" />
              <p className="mt-2 font-semibold">{item.name}</p>
              <a className="btn-primary btn-lg mt-4" href={item.src} target="_blank" rel="noopener noreferrer">
                Open PDF ↗
              </a>
            </div>
          ) : (
            <iframe
              key={item.src}
              title={`${label} (PDF)`}
              src={`${item.src}#view=FitH`}
              className="h-full w-full max-w-[900px] rounded-sm bg-[var(--web-bg)]"
            />
          ))}

        {many && !zoomed && (
          <button type="button" className={`${arrow} right-3`} onClick={() => go(1)} aria-label="Next">
            <span className="i-ph:caret-right-bold text-[22px]" />
          </button>
        )}
      </div>

      {item.type === "image" && (
        <p className="pb-1 text-center text-caption text-on-media opacity-70" aria-hidden="true">
          {isTouchDevice() ? "Pinch or double-tap to zoom" : "Double-click to zoom"}
        </p>
      )}

      {many && (
        <div
          className="flex flex-none justify-center gap-2 overflow-x-auto px-4 pb-4"
          style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
        >
          {items.map((it, i) => (
            <button
              key={it.src}
              type="button"
              onClick={() => go(i - index)}
              aria-label={`Show ${it.name}`}
              aria-current={i === index ? "true" : undefined}
              className={`relative size-14 flex-none overflow-hidden rounded-sm ring-2 ${
                i === index ? "ring-[var(--on-media)]" : "ring-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {it.thumb || it.poster ? (
                <img src={it.thumb ?? it.poster} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <span className="i-ph:file-pdf-duotone size-full" />
              )}
              {it.type === "video" && (
                <span className="i-ph:play-fill absolute inset-0 m-auto text-[18px]" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
