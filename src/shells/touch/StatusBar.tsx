import { useSensory } from "~/sensory/settings";
import { feedback } from "~/sensory/feedback";

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/** Safe-area-aware status bar: the time and the sound mute toggle (nothing fake). */
export default function StatusBar() {
  const [time, setTime] = useState(now);
  const muted = useSensory((s) => s.muted);
  const toggleMute = useSensory((s) => s.toggleMute);

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
          className={muted ? "i-ph:speaker-simple-slash-bold text-[18px]" : "i-ph:speaker-simple-high-bold text-[18px]"}
        />
      </button>
    </div>
  );
}
