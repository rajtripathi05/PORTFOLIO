import type React from "react";
import { liveProjectLinks, mustOpenInNewTab, portfolio, safeHost } from "~/data/portfolio";
import { previewForUrl } from "~/data/previews";
import { useAppHost } from "~/shells/host";
import { openInNewTab } from "~/utils";

// Browsers can't reliably tell from JS whether a site refused to be framed, so if the
// iframe hasn't fired `load` within this time we offer to open it in its own tab.
const LOAD_TIMEOUT_MS = 6000;

const normaliseUrl = (input: string): string | null => {
  const s = input.trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
};

// Solid tile colours from the icon palette (white initials stay readable in both themes).
const tileColors = [
  "var(--icon-about-2)",
  "var(--icon-skills-2)",
  "var(--icon-experience-2)",
  "var(--icon-ai-2)",
  "var(--file-pdf)",
  "var(--icon-projects-2)"
];

const Favorites = ({ onOpen }: { onOpen: (url: string) => void }) => {
  const links = liveProjectLinks();
  const { identity } = portfolio;
  const web = [
    { label: "LinkedIn", url: identity.linkedin, icon: "i-ph:linkedin-logo-fill" },
    { label: "GitHub", url: identity.github, icon: "i-ph:github-logo-fill" }
  ];

  return (
    <div className="app-scroll bg-panel-2">
      <div className="mx-auto max-w-[820px] px-6 py-8">
        <h1 className="text-title font-bold">Favorites</h1>
        <p className="mt-1 text-ink-2">Raj's live projects. Click one to open it.</p>
        <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {links.map((l, i) => {
            const newTab = mustOpenInNewTab(l.url);
            const preview = previewForUrl(l.url);
            return (
              <li key={l.url}>
                <button
                  type="button"
                  onClick={() => (newTab ? openInNewTab(l.url) : onOpen(l.url))}
                  aria-label={`${l.label}${newTab ? " (opens in a new tab)" : ""}`}
                  className="app-card group flex h-full w-full flex-col overflow-hidden bg-panel text-left shadow-resting transition duration-standard ease-standard hover:-translate-y-0.5 hover:shadow-raised"
                >
                  <span className="relative block aspect-[16/10] w-full overflow-hidden border-b border-hairline">
                    {preview ? (
                      <img
                        src={preview.srcSm}
                        alt=""
                        width={480}
                        height={300}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover object-top"
                        style={{ backgroundColor: preview.color }}
                      />
                    ) : (
                      <span
                        className="grid size-full place-items-center text-title font-bold text-on-media"
                        style={{ background: tileColors[i % tileColors.length] }}
                        aria-hidden="true"
                      >
                        {l.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5 p-3">
                    <span className="text-footnote font-semibold leading-snug">{l.label}</span>
                    <span className="text-caption text-ink-3">
                      {safeHost(l.url)}
                      {newTab && " ↗"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h2 className="app-h2 mt-9">Elsewhere (opens in a new tab)</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {web.map((w) => (
            <li key={w.url}>
              <ExternalLink href={w.url}>
                <span className={w.icon} aria-hidden="true" />
                {w.label}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const NewTabOnly = ({ url }: { url: string }) => (
  <div className="flex-center h-full bg-panel-2 p-6">
    <div className="max-w-[420px] text-center">
      <span className="i-ph:arrow-square-out-duotone text-[56px] text-accent-text" aria-hidden="true" />
      <h2 className="mt-2 text-headline font-bold">{safeHost(url)} opens in its own tab</h2>
      <p className="mt-1.5 text-ink-2">This site can't be shown inside another page.</p>
      <div className="mt-5">
        <ExternalLink href={url} className="btn-primary btn-lg">
          Open {safeHost(url)}
        </ExternalLink>
      </div>
    </div>
  </div>
);

export default function Safari() {
  const { width, params, nonce } = useAppHost();
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(-1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [address, setAddress] = useState("");
  const [invalid, setInvalid] = useState(false);

  const url = index >= 0 ? history[index] : null;
  const newTabOnly = !!url && mustOpenInNewTab(url);
  const narrow = width < 560;
  const preview = url ? previewForUrl(url) : undefined;

  const navigate = (next: string) => {
    setHistory((h) => [...h.slice(0, index + 1), next]);
    setIndex((i) => i + 1);
  };

  // Opening Safari with { url } (from Projects, Spotlight, the assistant) loads it.
  useEffect(() => {
    const target = params?.url;
    if (typeof target === "string" && target !== url) navigate(target);
  }, [nonce]);

  useEffect(() => {
    setAddress(url ?? "");
    setInvalid(false);
    if (!url || newTabOnly) {
      setLoading(false);
      setTimedOut(false);
      return;
    }
    setLoading(true);
    setTimedOut(false);
    const t = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [url, reloadKey]);

  const onLoad = () => {
    setLoading(false);
    setTimedOut(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = normaliseUrl(address);
    if (!next) {
      setInvalid(true);
      return;
    }
    if (next === url) setReloadKey((k) => k + 1);
    else navigate(next);
  };

  const iconBtn =
    "grid size-8 place-items-center rounded-sm text-ink-2 hover:bg-panel-3 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-1 border-b border-hairline bg-panel-2 px-2 py-1.5">
        <button
          type="button"
          className={iconBtn}
          onClick={() => setIndex((i) => i - 1)}
          disabled={index < 0}
          aria-label="Back"
          title="Back"
        >
          <span className="i-ph:caret-left-bold" />
        </button>
        <button
          type="button"
          className={iconBtn}
          onClick={() => setIndex((i) => i + 1)}
          disabled={index >= history.length - 1}
          aria-label="Forward"
          title="Forward"
        >
          <span className="i-ph:caret-right-bold" />
        </button>
        {!narrow && (
          <button
            type="button"
            className={iconBtn}
            onClick={() => navigate("")}
            disabled={!url}
            aria-label="Favorites"
            title="Favorites"
          >
            <span className="i-ph:star-bold" />
          </button>
        )}

        <form onSubmit={submit} className="relative mx-1 min-w-0 flex-1" role="search">
          <span
            className={`${url?.startsWith("http://") ? "i-ph:lock-simple-open" : "i-ph:lock-simple-fill"} pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ink-3`}
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="url"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setInvalid(false);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Favorites — choose a project below"
            aria-label="Address"
            aria-invalid={invalid}
            spellCheck={false}
            className={`h-8 w-full rounded-button border bg-panel pl-7 pr-8 text-center text-footnote text-ink-1 outline-none focus:text-left focus:border-accent ${
              invalid ? "border-danger" : "border-hairline"
            }`}
          />
          {url && !newTabOnly && (
            <button
              type="button"
              className="absolute right-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-ink-2 hover:bg-panel-3"
              onClick={() => setReloadKey((k) => k + 1)}
              aria-label="Reload page"
              title="Reload"
            >
              <span className="i-ph:arrow-clockwise-bold text-[14px]" />
            </button>
          )}
        </form>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => url && openInNewTab(url)}
          disabled={!url}
          title={url ? `Open ${safeHost(url)} in a new tab` : "Pick a site first"}
        >
          {narrow ? "New tab" : "Open in new tab"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-[var(--web-bg)]">
        {!url ? (
          <Favorites onOpen={navigate} />
        ) : newTabOnly ? (
          <NewTabOnly url={url} />
        ) : (
          <>
            <iframe
              key={`${url}#${reloadKey}`}
              title={`Website preview: ${safeHost(url)}`}
              src={url}
              onLoad={onLoad}
              className="size-full border-0 bg-[var(--web-bg)]"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              referrerPolicy="no-referrer-when-downgrade"
              allow="fullscreen; clipboard-write"
            />
            {loading && !timedOut && (
              <div className="absolute inset-0" role="status" aria-label={`Loading ${safeHost(url)}`}>
                {/* Preview of the site behind a soft blur, so loading never shows a blank box. */}
                {preview ? (
                  <img
                    src={preview.src}
                    alt=""
                    className="size-full scale-105 object-cover object-top opacity-70 blur-md"
                    style={{ backgroundColor: preview.color }}
                  />
                ) : (
                  <div className="size-full bg-panel-2" />
                )}
                <div className="safari-progress" aria-hidden="true" />
                <span className="absolute left-1/2 top-5 -translate-x-1/2 rounded-chip bg-[var(--toast-bg)] px-3 py-1 text-footnote font-medium text-on-media shadow-raised">
                  Loading {safeHost(url)}…
                </span>
              </div>
            )}
            {timedOut && (
              <div className="absolute inset-0 overflow-hidden" role="alert">
                {preview && (
                  <img
                    src={preview.src}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 size-full scale-110 object-cover object-top opacity-50 blur-lg"
                  />
                )}
                <div className="absolute inset-0 flex-center p-6">
                  <div className="material-popover w-full max-w-[440px] overflow-hidden rounded-panel border border-hairline text-center shadow-overlay">
                    {preview && (
                      <img
                        src={preview.srcSm}
                        alt={`Preview of ${safeHost(url)}`}
                        width={480}
                        height={300}
                        className="aspect-[16/9] w-full border-b border-hairline object-cover object-top"
                      />
                    )}
                    <div className="px-6 pb-6 pt-5">
                      <h2 className="text-headline font-bold">This site prefers to open in its own tab</h2>
                      <p className="mt-1.5 text-ink-2">
                        Some sites don't allow being shown inside another page. It opens in one click.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <ExternalLink href={url} className="btn-primary btn-lg">
                          Open {safeHost(url)}
                        </ExternalLink>
                        <button type="button" className="btn-secondary btn-lg" onClick={() => setTimedOut(false)}>
                          Keep waiting
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
