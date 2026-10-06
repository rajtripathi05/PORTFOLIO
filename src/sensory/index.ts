export { feedback } from "./feedback";
export { useSensory } from "./settings";

/**
 * Called once at startup. Installs the one-time first-interaction listener that
 * creates/resumes the AudioContext and lazy-loads the sound engine.
 */
export function initSensory(): void {}
