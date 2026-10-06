import { format } from "date-fns";
import { feedback } from "~/sensory/feedback";

/** "About This Portfolio": credits and licence notes. Shell-agnostic. */
export default function Credits({ onClose }: { onClose: () => void }) {
  return (
    <Dialog label="About This Portfolio" onClose={onClose} width={420}>
      <div className="flex flex-col items-center px-8 pb-7 pt-8 text-center">
        <span className="grid size-20 place-items-center rounded-panel tile-terminal text-on-media shadow-raised">
          <Monogram size={52} />
        </span>
        <h1 className="mt-4 text-headline font-bold">About This Portfolio</h1>
        <p className="mt-1 text-footnote text-ink-3 tabular-nums">
          Last updated {format(new Date(__BUILD_DATE__), "d MMMM yyyy")}
        </p>
        <p className="mt-4 text-body leading-relaxed text-ink-2">
          Built with React, TypeScript, Vite and UnoCSS. The desktop interface is based on{" "}
          <a
            className="text-link"
            href="https://github.com/Renovamen/playground-macos"
            target="_blank"
            rel="noopener noreferrer"
          >
            playground-macos
          </a>{" "}
          by Xiaohan Zou (Renovamen), used under the MIT License.
        </p>
        <p className="mt-3 text-footnote leading-relaxed text-ink-3">
          Not affiliated with or endorsed by Apple. Font: Inter. Icons: Phosphor. Wallpapers, sounds and the RT
          monogram are original.
        </p>
        <button
          type="button"
          className="btn-primary mt-6 w-full"
          onClick={() => {
            feedback("tap");
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </Dialog>
  );
}
