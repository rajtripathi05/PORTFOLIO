import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";
import { isTouchDevice } from "~/utils";

const { resumePdf, name } = portfolio.identity;
const FILE_NAME = "Raj_Tripathi_Resume.pdf";

// Phones and tablets don't reliably render PDFs inside a page, so they get a card instead.
const canEmbedPdf = () =>
  !isTouchDevice() && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function Resume() {
  const { mobile } = useWindow();
  const embed = !mobile && canEmbedPdf();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-hairline bg-panel-2 px-3 py-2">
        <p className="hstack min-w-0 gap-2 text-footnote font-semibold text-ink-2">
          <span className="i-ph:file-pdf-fill text-[18px] text-file-pdf" aria-hidden="true" />
          <span className="truncate">{FILE_NAME}</span>
        </p>
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
          title={`${name} — resume (PDF)`}
          src={`${resumePdf}#view=FitH`}
          className="min-h-0 w-full flex-1 bg-panel-3"
          loading="lazy"
        />
      ) : (
        <div className="app-scroll flex-1">
          <div className="mx-auto flex max-w-[420px] flex-col items-center px-6 py-10 text-center">
            <span className="i-ph:file-pdf-duotone text-[72px] text-file-pdf" aria-hidden="true" />
            <h1 className="mt-3 text-headline font-bold">{name} — Resume</h1>
            <p className="mt-1 text-ink-2">PDF · 2 pages</p>
            <div className="mt-6 grid w-full gap-2">
              <a className="btn-primary btn-lg" href={resumePdf} download={FILE_NAME}>
                <span className="i-ph:download-simple-bold" aria-hidden="true" />
                Download PDF
              </a>
              <ExternalLink href={resumePdf} className="btn-secondary btn-lg">
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
