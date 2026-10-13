import { useSensory } from "~/sensory/settings";
import { feedback } from "~/sensory/feedback";

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Safe-area-aware status bar: the time, the sound mute toggle (always one tap away)
 * and Control Center. Nothing fake (no signal or battery).
 */
export default function StatusBar() {
  const [time, setTime] = useState(now);
  const muted = useSensory((s) => s.muted);
  const toggleMute = useSensory((s) => s.toggleMute);
  const overlay = useStore((s) => s.overlay);
  const toggleOverlay = useStore((s) => s.toggleOverlay);

  useEffect(() => {
    const t = setInterval(() => setTime(now()), 15000);
    return () => clearInterval(t);
  }, []);

  const onMute = () => {
    if (muted) {
      toggleMute();
      feedback("toggle");
    } else {
      feedback("toggle");
      toggleMute();
    }
  };

  return (
    <div className="touch-status">
      <time className="touch-status-time">{time}</time>
      <div className="flex items-center">
        <button
          type="button"
          className="touch-status-btn press"
          onClick={onMute}
          aria-pressed={muted}
          aria-label="Mute sounds"
          title={muted ? "Sounds off" : "Sounds on"}
        >
          <span
            aria-hidden="true"
            className={muted ? "i-ph:speaker-simple-slash-bold text-[19px]" : "i-ph:speaker-simple-high-bold text-[19px]"}
          />
        </button>
        <button
          type="button"
          className="touch-status-btn press -mr-2.5"
          data-cc-toggle
          onClick={() => {
            feedback("tap");
            toggleOverlay("control");
          }}
          aria-expanded={overlay === "control"}
          aria-label="Control Center"
          title="Control Center"
        >
          <span aria-hidden="true" className="i-ph:sliders-horizontal-bold text-[20px]" />
        </button>
      </div>
    </div>
  );
}
