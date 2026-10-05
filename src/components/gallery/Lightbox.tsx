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

export default function Lightbox({ title, items, index, onIndex, onClose }: LightboxProps) {
  const item = items[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const many = items.length > 1;

  const go = (delta: number) => onIndex((index + delta + items.length) % items.length);

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

  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || !many) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1);
  };

  const arrow =
    "absolute top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-media-control text-on-media backdrop-blur hover:bg-media-control-hover";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-scrim-strong text-on-media backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — media viewer`}
    >
      <div className="flex flex-none items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-body">
          <span className="font-semibold">{title}</span>
          <span className="text-on-media opacity-80"> — {item.name}</span>
        </p>
        {many && (
          <span className="text-footnote tabular-nums text-on-media opacity-80" aria-live="polite">
            {index + 1} of {items.length}
          </span>
        )}
        <a
          href={item.src}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm bg-media-control text-on-media hover:bg-media-control-hover"
        >
          Open original <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full bg-media-control hover:bg-media-control-hover"
          aria-label="Close viewer (Esc)"
        >
          <span className="i-ph:x-bold text-[18px]" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {many && (
          <button type="button" className={`${arrow} left-3`} onClick={() => go(-1)} aria-label="Previous">
            <span className="i-ph:caret-left-bold text-[22px]" />
          </button>
        )}

        {item.type === "image" && (
          <img
            key={item.src}
            src={item.src}
            alt={`${title} — ${item.name}`}
            width={item.width}
            height={item.height}
            className="max-h-full max-w-full select-none rounded-sm object-contain"
            draggable={false}
          />
        )}
        {item.type === "video" && (
          <video
            key={item.src}
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            preload="metadata"
            className="max-h-full max-w-full rounded-sm bg-[var(--media-bg)]"
            aria-label={`${title} — ${item.name} (${formatDuration(item.duration)})`}
          />
        )}
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
              title={`${title} — ${item.name} (PDF)`}
              src={`${item.src}#view=FitH`}
              className="h-full w-full max-w-[900px] rounded-sm bg-[var(--web-bg)]"
            />
          ))}

        {many && (
          <button type="button" className={`${arrow} right-3`} onClick={() => go(1)} aria-label="Next">
            <span className="i-ph:caret-right-bold text-[22px]" />
          </button>
        )}
      </div>

      {many && (
        <div className="flex flex-none justify-center gap-2 overflow-x-auto px-4 pb-4">
          {items.map((it, i) => (
            <button
              key={it.src}
              type="button"
              onClick={() => onIndex(i)}
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
