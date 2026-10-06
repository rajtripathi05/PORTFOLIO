/**
 * Generative ambient pad — lazy, opt-in (Settings / Control Centre). Three slowly wandering
 * voices from the same D-major pentatonic as the UI sounds; each voice is two detuned
 * oscillators, all through a breathing low-pass filter, plus faint "air" noise.
 * Peaks stay below ≈ −30 dBFS. 2s fade-in; fades out while the tab is hidden.
 */
import { useSensory } from "./settings";

/** Bus gain: the summed voices peak at ≤ ~1.37, so ≤ 0.0315 (−30 dBFS) at full ambient volume. */
const LEVEL = 0.023;
// D2 A2 D3 E3 F♯3 A3 B3 D4 E4 F♯4
const SCALE = [38, 45, 50, 52, 54, 57, 59, 62, 64, 66];
const RANGES = [
  [0, 3],
  [3, 6],
  [6, 9]
];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let nodes: AudioScheduledSourceNode[] = [];
let voices: OscillatorNode[][] = [];
let notes = [2, 5, 8];
let wander = 0;
let stopTimer = 0;

const target = () => {
  const p = useSensory.getState();
  return p.ambient && !p.muted && !document.hidden ? LEVEL * p.ambientVolume * Math.min(1, p.volume / 0.3) : 0;
};

function start(c: AudioContext) {
  ctx = c;
  bus = c.createGain();
  bus.gain.value = 0;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;
  lp.Q.value = 0.5;
  lp.connect(bus).connect(c.destination);

  const lfo = (rate: number, depth: number, param: AudioParam) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = rate;
    g.gain.value = depth;
    o.connect(g).connect(param);
    o.start();
    nodes.push(o);
  };
  lfo(0.05, 350, lp.frequency);

  voices = notes.map((note, i) => {
    const g = c.createGain();
    g.gain.value = 0.16;
    g.connect(lp);
    lfo(0.07 + i * 0.023, 0.06, g.gain); // slow breathing
    return [-6, 6].map((cents) => {
      const o = c.createOscillator();
      o.type = i ? "triangle" : "sine";
      o.detune.value = cents + i * 2;
      o.frequency.value = hz(SCALE[note]);
      o.connect(g);
      o.start();
      nodes.push(o);
      return o;
    });
  });

  // Faint air: looped noise through a wide band-pass.
  const air = c.createBufferSource();
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  air.buffer = buf;
  air.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2500;
  bp.Q.value = 0.4;
  const ag = c.createGain();
  ag.gain.value = 0.05;
  air.connect(bp).connect(ag).connect(bus);
  air.start();
  nodes.push(air);

  // Evolve: every few seconds one voice glides a step or two along the scale.
  let turn = 0;
  wander = window.setInterval(() => {
    const i = turn++ % voices.length;
    const [lo, hi] = RANGES[i];
    notes[i] = Math.max(lo, Math.min(hi, notes[i] + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.round(Math.random()))));
    for (const o of voices[i]) o.frequency.setTargetAtTime(hz(SCALE[notes[i]]), c.currentTime, 2.5);
  }, 6000);
}

function stop() {
  clearInterval(wander);
  nodes.forEach((o) => {
    try {
      o.stop();
    } catch {
      /* already stopped */
    }
  });
  bus?.disconnect();
  nodes = [];
  voices = [];
  bus = null;
}

/** Applies the current prefs: starts, fades, or stops the pad. Called from a click (or visibility change). */
export function syncPad(c: AudioContext): void {
  const on = useSensory.getState().ambient;
  if (on) clearTimeout(stopTimer);
  if (on && !bus) start(c);
  if (!bus || !ctx) return;
  const t = ctx.currentTime;
  const v = target();
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(bus.gain.value, t);
  bus.gain.linearRampToValueAtTime(v, t + (v ? 2 : 1));
  if (!on) stopTimer = window.setTimeout(stop, 1200);
}

document.addEventListener("visibilitychange", () => {
  if (ctx && bus) syncPad(ctx);
});
