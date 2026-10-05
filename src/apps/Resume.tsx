import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";
import { isTouchDevice } from "~/utils";

const { resumePdf, name } = portfolio.identity;
const FILE_NAME = "Raj_Tripathi_Resume.pdf";
const ZOOMS = [75, 100, 125, 150, 200];

// Phones and tablets don't reliably render PDFs inside a page, so they get a card instead.
const canEmbedPdf = () => !isTouchDevice() && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function Resume() {
  const { mobile } = useWindow();
  const embed = !mobile && canEmbedPdf();
  // null = fit to width
  const [zoom, setZoom] = useState<number | null>(null);

  const step = (dir: 1 | -1) => {
    const current = zoom ?? 100;
    const next = dir > 0 ? ZOOMS.find((z) => z > current) : [...ZOOMS].reverse().find((z) => z < current);
    if (next) setZoom(next);
  };
  const src = `${resumePdf}#${zoom ? `zoom=${zoom}` : "view=FitH"}`;
  const iconBtn =
    "grid size-8 place-items-center rounded-button text-ink-2 transition-colors duration-micro hover:bg-panel-3 disabled:opacity-40";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-hairline bg-panel-2 px-3 py-2">
        <p className="hstack min-w-0 gap-2 text-footnote font-semibold text-ink-2">
          <span className="i-ph:file-pdf-fill text-[18px] text-file-pdf" aria-hidden="true" />
          <span className="truncate">{FILE_NAME}</span>
        </p>
        {embed && (
          <div className="hstack gap-1" role="group" aria-label="Zoom">
            <button type="button" className={iconBtn} onClick={() => step(-1)} disabled={zoom === ZOOMS[0]} aria-label="Zoom out">
              <span className="i-ph:minus-bold" />
            </button>
            <span className="w-12 text-center text-footnote tabular text-ink-2" aria-live="polite">
              {zoom ? `${zoom}%` : "Fit"}
            </span>
            <button
              type="button"
              className={iconBtn}
              onClick={() => step(1)}
              disabled={zoom === ZOOMS[ZOOMS.length - 1]}
              aria-label="Zoom in"
            >
              <span className="i-ph:plus-bold" />
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setZoom(null)}
              disabled={zoom === null}
              aria-label="Fit to width"
            >
              Fit
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <ExternalLink href={resumePdf} className="btn-secondary btn-sm">
            Open in new tab
          </ExternalLink>
          <a className="btn-primary btn-sm" href={resumePdf} download={FILE_NAME}>
            <span className="i-ph:download-simple-bold" aria-hidden="true" />
            Download
          </a>
        </div>
      </div>

      {embed ? (
        <iframe
          key={src}
          title={`${name} — resume (PDF)`}
          src={src}
          className="min-h-0 w-full flex-1 bg-panel-3"
        />
      ) : (
        <div className="app-scroll flex-1">
          <div className="mx-auto flex max-w-[420px] flex-col items-center px-6 py-10 text-center">
            <span className="grid size-24 place-items-center rounded-panel bg-panel-2 shadow-resting">
              <span className="i-ph:file-pdf-duotone text-[56px] text-file-pdf" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-headline font-bold">{name} — Resume</h1>
            <p className="mt-1 text-ink-2">PDF · 2 pages</p>
            <div className="mt-6 grid w-full gap-2">
              <a className="btn-primary btn-lg pressable" href={resumePdf} download={FILE_NAME}>
                <span className="i-ph:download-simple-bold" aria-hidden="true" />
                Download PDF
              </a>
              <ExternalLink href={resumePdf} className="btn-secondary btn-lg pressable">
                Open PDF
              </ExternalLink>
              <a className="btn-ghost btn-lg" href="/quick">
                Read it as a web page (Quick View)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
