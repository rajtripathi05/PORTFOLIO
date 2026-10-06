import { portfolio } from "~/data/portfolio";

interface WelcomeProps {
  onStart: () => void;
}

export default function Welcome({ onStart }: WelcomeProps) {
  const startRef = useRef<HTMLButtonElement>(null);
  const { identity } = portfolio;

  return (
    <Dialog label="Welcome" onClose={onStart} width={460} initialFocus={startRef}>
      <div className="flex flex-col items-center px-8 pb-7 pt-8 text-center">
        <img
          src={identity.photo}
          alt={`Photo of ${identity.name}`}
          width={96}
          height={96}
          className="size-24 rounded-full object-cover shadow-raised ring-4 ring-[var(--photo-ring)]"
        />
        <h1 className="mt-4 text-title font-bold tracking-tight">Hi, I'm {identity.firstName} 👋</h1>
        <p className="mt-2 text-body leading-relaxed text-ink-2">
          This is my portfolio, designed like a Mac desktop. Click any icon in the dock below to explore — or
          use <strong className="text-ink-1">Quick View</strong> for a simple scrollable version.
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
          <button ref={startRef} type="button" className="btn-primary btn-lg" onClick={onStart}>
            Start exploring
          </button>
          <a className="btn-secondary btn-lg" href="/quick">
            Quick View
          </a>
        </div>
        <p className="mt-4 text-footnote text-ink-3">Tip: click any icon in the dock.</p>
      </div>
    </Dialog>
  );
}
