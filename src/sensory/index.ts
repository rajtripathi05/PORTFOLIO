import { setPlayer } from "./feedback";
import { useSensory } from "./settings";

export { feedback } from "./feedback";
export { useSensory } from "./settings";

const EVENTS = ["pointerdown", "keydown", "touchend"] as const;

/**
 * Called once at startup. Installs the one-time first-interaction listener that
 * creates/resumes the AudioContext and lazy-loads the sound engine (browsers block
 * audio that starts on its own, and the site never autoplays).
 */
export function initSensory(): void {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  const boot = () => {
    EVENTS.forEach((e) => window.removeEventListener(e, boot, true));
    const ctx = new Ctor();
    void ctx.resume().catch(() => undefined);
    void Promise.all([import("./engine"), import("./pad")])
      .then(([engine, pad]) => {
        setPlayer(engine.createEngine(ctx));
        const sync = () => pad.syncPad(ctx);
        useSensory.subscribe(sync);
        sync();
      })
      .catch(() => undefined); // sound is an enhancement: fail silent
  };
  EVENTS.forEach((e) => window.addEventListener(e, boot, { capture: true, passive: true }));
}
