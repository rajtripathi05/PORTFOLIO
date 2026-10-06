import { shortcutLabel } from "~/utils";

const shortcuts: [string, string][] = [
  [shortcutLabel("K"), "Search the portfolio"],
  ["Esc", "Close the front window, menu or viewer"],
  ["⌘M / Ctrl+M", "Minimize the front window"],
  ["?", "Show this help"],
  ["← / →", "Previous / next photo in the viewer"]
];

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  const setOverlay = useStore((s) => s.setOverlay);
  const openApp = useStore((s) => s.openApp);

  return (
    <Dialog label="How to use this site" onClose={onClose} width={520}>
      <div className="px-7 pb-6 pt-6">
        <h1 className="text-headline font-bold">How to use this site</h1>
        <ul className="mt-4 space-y-3 text-body leading-relaxed">
          <li className="flex gap-3">
            <span className="i-ph:cursor-click-bold mt-0.5 text-[18px] text-accent-text" aria-hidden="true" />
            <span>
              <strong>Click any icon</strong> in the dock at the bottom (or on the desktop) to open it.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="i-ph:app-window-bold mt-0.5 text-[18px] text-accent-text" aria-hidden="true" />
            <span>
              Windows have three buttons at the top-left: <strong>red closes</strong>,{" "}
              <strong>yellow minimizes</strong> to the dock, <strong>green maximizes</strong>. Drag the title bar
              to move a window, and its edges to resize it.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="i-ph:sparkle-bold mt-0.5 text-[18px] text-accent-text" aria-hidden="true" />
            <span>
              <strong>Ask AI</strong> (top right) answers questions about Raj's work.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="i-ph:article-bold mt-0.5 text-[18px] text-accent-text" aria-hidden="true" />
            <span>
              Prefer a normal web page? <a className="text-link font-semibold" href="/quick">Open Quick View</a>.
            </span>
          </li>
        </ul>

        <h2 className="app-h2 mt-6">Keyboard shortcuts</h2>
        <dl className="mt-2 divide-y divide-[var(--hairline)] rounded-card border border-hairline">
          {shortcuts.map(([keys, what]) => (
            <div key={keys} className="flex items-center justify-between gap-4 px-4 py-2 text-body">
              <dt className="text-ink-2">{what}</dt>
              <dd>
                <kbd className="rounded-sm border border-hairline bg-panel px-2 py-0.5 font-mono text-footnote">
                  {keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setOverlay(null);
              openApp("projects");
            }}
          >
            Show me the projects
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </Dialog>
  );
}
