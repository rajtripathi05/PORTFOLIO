import { portfolio } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";
import { useSensory } from "~/sensory/settings";
import { startTour } from "~/features/tour";

interface WelcomeProps {
  /** "Start exploring" (and Escape / backdrop): the shell opens About Me and shows the "Start here" hint. */
  onStart: () => void;
  /** Closes the card without opening anything (before Quick View or the tour). Defaults to `onStart`. */
  onDismiss?: () => void;
}

/** First-visit welcome card. Shell-agnostic: the desktop, tablet and phone shells all use it. */
export default function Welcome({ onStart, onDismiss }: WelcomeProps) {
  const startRef = useRef<HTMLButtonElement>(null);
  const { identity } = portfolio;
  const muted = useSensory((s) => s.muted);
  const toggleMute = useSensory((s) => s.toggleMute);
  const dismiss = onDismiss ?? onStart;

  return (
    <Dialog label="Welcome" onClose={onStart} width={460} initialFocus={startRef}>
      <div className="relative flex flex-col items-center px-8 pb-7 pt-8 text-center">
        <button
          type="button"
          className="btn-secondary btn-sm absolute right-4 top-4 rounded-full"
          aria-pressed={muted}
          aria-label={muted ? "Sound is off. Turn sound on" : "Sound is on. Mute sounds"}
          onClick={() => {
            toggleMute();
            feedback("toggle");
          }}
        >
          <span
            className={muted ? "i-ph:speaker-simple-slash-bold" : "i-ph:speaker-simple-high-bold"}
            aria-hidden="true"
          />
          {muted ? "Sound off" : "Sound on"}
        </button>
        <img
          src={identity.photo}
          alt={`Photo of ${identity.name}`}
          width={96}
          height={96}
          className="size-24 rounded-full object-cover shadow-raised ring-4 ring-[var(--photo-ring)]"
        />
        <h1 className="mt-4 text-title font-bold tracking-tight">
          Hi, I'm {identity.firstName}{" "}
          <span className="wave-once" role="img" aria-label="waving hand">
            👋
          </span>
        </h1>
        <p className="mt-2 text-body leading-relaxed text-ink-2">
          Thanks for stopping by. Have a look around — every icon opens a part of my work.
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
          <button
            ref={startRef}
            type="button"
            className="btn-primary btn-lg"
            onClick={() => {
              feedback("tap");
              onStart();
            }}
          >
            Start exploring
          </button>
          <a
            className="btn-secondary btn-lg"
            href="/quick"
            onClick={() => {
              feedback("tap");
              dismiss();
            }}
          >
            Quick View
          </a>
          <button
            type="button"
            className="btn-secondary btn-lg col-span-2"
            onClick={() => {
              feedback("tap");
              dismiss();
              startTour();
            }}
          >
            <span className="i-ph:play-circle-bold" aria-hidden="true" />
            Take a 30-second tour
          </button>
        </div>
      </div>
    </Dialog>
  );
}
