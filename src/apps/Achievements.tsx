import type React from "react";
import { achievementTitle, portfolio, type Achievement } from "~/data/portfolio";
import { coverFor, mediaFor, mediaSummary, otherHighlights, type MediaItem } from "~/data/media";
import { useAppBack, useAppHost } from "~/shells/host";
import { deepLinkUrl } from "~/utils";
import { feedback } from "~/sensory/feedback";

interface Album {
  id: string;
  title: string;
  achievement?: Achievement;
  items: MediaItem[];
}

// Winners first, then runner-up, then other awards (stable within each group).
const rank = (a: Achievement) => (a.result === "Winner" ? 0 : a.result === "Runner-Up" ? 1 : 2);

const albums: Album[] = [
  ...[...portfolio.achievements]
    .sort((a, b) => rank(a) - rank(b))
    .map((a) => ({ id: a.id, title: a.name, achievement: a, items: mediaFor(a) })),
  ...otherHighlights().map((o) => ({ id: o.id, title: o.name, items: o.items }))
];

const formatDuration = (s?: number) =>
  s === undefined ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const DriveLink = ({ large }: { large?: boolean }) => (
  <a
    href={portfolio.driveArchiveUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => feedback("open")}
    className={`btn-secondary ${large ? "btn-lg active:scale-[.96]" : "btn-sm"}`}
  >
    <span className="i-ph:google-drive-logo-bold" aria-hidden="true" />
    View full archive on Google Drive
    <span aria-hidden="true"> ↗</span>
    <span className="sr-only"> (opens in a new tab)</span>
  </a>
);

const Thumb = ({ item, alt }: { item: MediaItem; alt: string }) => {
  if (item.type === "pdf")
    return (
      <span className="flex-center size-full flex-col gap-1 bg-panel-3 text-ink-2">
        <span className="i-ph:file-pdf-duotone text-[40px] text-file-pdf" aria-hidden="true" />
        <span className="text-footnote font-semibold">PDF</span>
      </span>
    );
  return (
    <>
      <LazyImage
        src={(item.thumb ?? item.poster)!}
        alt={alt}
        color={item.color}
        blur={item.blur}
        className="size-full"
      />
      {item.type === "video" && (
        <>
          <span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-media-chip text-on-media backdrop-blur-sm">
            <span className="i-ph:play-fill ml-0.5 text-[22px]" aria-hidden="true" />
          </span>
          {item.duration !== undefined && (
            <span className="absolute bottom-2 right-2 rounded-sm bg-media-chip px-1.5 py-0.5 text-caption font-semibold tabular-nums text-on-media">
              {formatDuration(item.duration)}
            </span>
          )}
        </>
      )}
    </>
  );
};

const AlbumView = ({
  album,
  onBack,
  wide,
  showBack,
  touch
}: {
  album: Album;
  onBack: () => void;
  wide: boolean;
  /** The phone shell shows its own "‹ Achievements" back button. */
  showBack: boolean;
  touch: boolean;
}) => {
  const [open, setOpen] = useState<number | null>(null);
  const a = album.achievement;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-6">
      {showBack && (
        <button
          type="button"
          className={`btn-ghost -ml-3 ${touch ? "btn-lg active:scale-[.96]" : "btn-sm"}`}
          onClick={() => {
            feedback("tap");
            onBack();
          }}
        >
          <span className="i-ph:caret-left-bold" aria-hidden="true" />
          All achievements
        </button>
      )}
      <h1 className="app-h1 mt-2">{a ? [a.name, a.result].filter(Boolean).join(" — ") : album.title}</h1>
      {a && (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <AchievementBadges a={a} />
            <CopyButton
              text={deepLinkUrl("achievements", a.id)}
              label="Copy link"
              copiedLabel="Link to this achievement copied"
              className="btn-ghost btn-sm"
            />
          </div>
          <p className="mt-3 max-w-[68ch] text-body text-ink-1">{a.description}</p>
          {a.links?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {a.links.map((l) => (
                <span key={l.url} onClick={() => feedback("open")}>
                  <ExternalLink href={l.url} className={`btn-secondary ${touch ? "btn-lg" : "btn-sm"}`}>
                    <span className="i-ph:github-logo-bold" aria-hidden="true" />
                    {l.label}
                  </ExternalLink>
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}

      {album.items.length ? (
        <ul className={`mt-6 grid gap-2 ${wide ? "grid-cols-3" : "grid-cols-2"}`}>
          {album.items.map((item, i) => (
            <li key={item.src}>
              <button
                type="button"
                onClick={() => {
                  feedback("open");
                  setOpen(i);
                }}
                className="relative block aspect-square w-full overflow-hidden rounded-card ring-accent transition-transform duration-micro focus-visible:ring-2 active:scale-[.96]"
                aria-label={`Open ${item.type === "video" ? "video" : item.type === "pdf" ? "document" : "photo"}: ${item.name}`}
              >
                <Thumb item={item} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="app-card mt-6 flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="i-ph:images-duotone text-[44px] text-ink-3" aria-hidden="true" />
          <p className="text-ink-2">No photos here yet — the full archive is on Google Drive.</p>
          <DriveLink large={touch} />
        </div>
      )}
      {album.items.length > 0 && (
        <div className="mt-6">
          <DriveLink large={touch} />
        </div>
      )}

      {open !== null && (
        <Lightbox
          title={album.title}
          items={album.items}
          index={open}
          onIndex={setOpen}
          onClose={() => {
            feedback("close");
            setOpen(null);
          }}
        />
      )}
    </div>
  );
};

const AlbumCard = ({ album, onOpen }: { album: Album; onOpen: () => void }) => {
  const cover = coverFor(album.items);
  const a = album.achievement;
  return (
    <button
      type="button"
      onClick={() => {
        feedback("open");
        onOpen();
      }}
      aria-label={a ? `${achievementTitle(a)}${a.prize ? `, ${a.prize}` : ""} — open album` : `${album.title} — open album`}
      className="app-card group flex h-full w-full flex-col overflow-hidden bg-panel text-left transition duration-micro hover:shadow-raised active:scale-[.98]"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-panel-3">
        {cover ? (
          <LazyImage
            src={(cover.thumb ?? cover.poster)!}
            alt=""
            color={cover.color}
            blur={cover.blur}
            className="size-full transition-transform duration-standard group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex-center size-full">
            <span className="i-ph:trophy-duotone text-[48px] text-ink-3" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-callout font-bold leading-snug">{album.title}</span>
        {a && <AchievementBadges a={a} />}
        {a && <span className="text-body leading-relaxed text-ink-2">{a.description}</span>}
        {album.items.length > 0 && (
          <span className="mt-auto pt-1 text-footnote font-semibold text-ink-3">
            {mediaSummary(album.items)}
          </span>
        )}
      </span>
    </button>
  );
};

export default function Achievements() {
  const { shell, width, params, nonce } = useAppHost();
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touch = shell !== "desktop";

  // Phone/tablet: the album is a pushed detail; the shell's back button returns here.
  useAppBack(selected !== null, "Achievements", () => setSelected(null));

  useEffect(() => {
    const id = params?.id;
    if (typeof id === "string" && albums.some((a) => a.id === id)) setSelected(id);
  }, [nonce]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const album = albums.find((a) => a.id === selected);
  const achievementsList = albums.filter((a) => a.achievement);
  const others = albums.filter((a) => !a.achievement);
  const cols = width < 560 ? "grid-cols-1" : width < 860 ? "grid-cols-2" : "grid-cols-3";

  const grid = (list: Album[]): React.ReactNode => (
    <ul className={`grid gap-4 ${cols}`}>
      {list.map((a) => (
        <li key={a.id}>
          <AlbumCard album={a} onOpen={() => setSelected(a.id)} />
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={scrollRef} className="app-scroll">
      {album ? (
        <AlbumView
          album={album}
          onBack={() => setSelected(null)}
          wide={width >= 640}
          showBack={shell !== "phone"}
          touch={touch}
        />
      ) : (
        <div className="mx-auto max-w-[1000px] px-6 py-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="app-h1">Achievements</h1>
              <p className="mt-1 text-ink-2">Open an award to see its photos, certificates and videos.</p>
            </div>
            <DriveLink large={touch} />
          </div>
          <div className="mt-6">{grid(achievementsList)}</div>
          {others.length > 0 && (
            <>
              <h2 className="app-h2 mt-9 mb-3">{portfolio.otherHighlightsTitle}</h2>
              {grid(others)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
