/**
 * UI sound engine — its own lazy chunk, loaded on the first interaction (src/sensory/index.ts).
 * No audio files: every sound is synthesised once with OfflineAudioContext into an AudioBuffer.
 * Character: warm, soft, "glassy-wooden" mallet tones, all in D major pentatonic (D E F♯ A B),
 * with a tiny generated-impulse reverb. Buffers are normalised so peaks sit at ≈ −18 dBFS.
 */
import type { FeedbackName, FeedbackOptions } from "~/types";
import { useSensory } from "./settings";

/** [frequency ratio, amplitude, decay scale] */
type Partials = number[][];
interface Synth {
  tone: (t: number, f: number, d: number, a: number, f2?: number, p?: Partials) => void;
  noise: (t: number, d: number, a: number, f: number, f2?: number, type?: BiquadFilterType, q?: number) => void;
  bar: (t: number, f: number, d: number, a: number) => void;
}

const PEAK = 0.126; // −18 dBFS
const REF_VOLUME = 0.3; // the default volume plays every sound at its designed level
const MAX_VOICES = 4;

const n = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const PURE: Partials = [[1, 1, 1]];
/** Wooden (marimba 4th partial) with a hint of glass (2.76). */
const WOOD: Partials = [
  [1, 1, 1],
  [3.98, 0.22, 0.28],
  [2.76, 0.06, 0.5]
];
const BELL: Partials = [
  [1, 1, 1],
  [2.76, 0.28, 0.45],
  [5.4, 0.07, 0.22]
];

/** name → [seconds, render, relative level] */
const SOUNDS: Record<string, [number, (s: Synth) => void, number]> = {
  tap: [0.08, (s) => s.bar(0, n(81), 0.05, 1), 0.7],
  open: [0.24, (s) => (s.tone(0, n(74), 0.18, 0.8, n(81), PURE), s.noise(0, 0.16, 0.45, 1200, 5000)), 0.8],
  minimize: [0.26, (s) => (s.tone(0, n(81), 0.22, 0.8, n(69), PURE), s.noise(0, 0.2, 0.3, 3000, 900)), 0.75],
  toggleUp: [0.12, (s) => (s.bar(0, n(76), 0.05, 0.9), s.bar(0.045, n(81), 0.07, 1)), 0.7],
  toggleDown: [0.12, (s) => (s.bar(0, n(81), 0.05, 0.9), s.bar(0.045, n(76), 0.07, 1)), 0.7],
  dockHover: [0.03, (s) => s.tone(0, n(98), 0.02, 1, 0, PURE), 0.22],
  typing: [0.03, (s) => (s.noise(0, 0.008, 1, 3500, 0, "bandpass", 2), s.tone(0, n(95), 0.015, 0.4, 0, PURE)), 0.25],
  swipe: [0.2, (s) => s.noise(0, 0.16, 1, 700, 2600, "bandpass", 1.4), 0.55],
  error: [
    0.26,
    (s) => {
      for (const t of [0, 0.12]) {
        s.tone(t, n(50), 0.1, 1, n(45), [
          [1, 1, 1],
          [2, 0.35, 0.5]
        ]);
        s.noise(t, 0.03, 0.35, 420, 0, "lowpass");
      }
    },
    0.9
  ],
  success: [0.7, (s) => [74, 78, 81].forEach((m, i) => s.bar(i * 0.075, n(m), 0.5, 0.9)), 0.9],
  notify: [0.9, (s) => (s.tone(0, n(81), 0.8, 1, 0, BELL), s.tone(0.09, n(86), 0.7, 0.7, 0, BELL)), 0.85],
  spotlight: [
    0.45,
    (s) => ([86, 88, 90, 93, 95].forEach((m, i) => s.tone(i * 0.028, n(m), 0.25, 0.5, 0, BELL)), s.noise(0, 0.2, 0.12, 6000, 9000, "highpass")),
    0.55
  ],
  boot: [1.3, (s) => (s.bar(0, n(69), 1, 0.8), s.bar(0.13, n(74), 1.15, 0.9)), 1]
};

const noiseBuffer = (ctx: AudioContext, seconds: number, channels: number, decay = 0) => {
  const buf = ctx.createBuffer(channels, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  for (let c = 0; c < channels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** decay;
  }
  return buf;
};

async function render(ctx: AudioContext, seconds: number, draw: (s: Synth) => void, level: number, noise: AudioBuffer, impulse: AudioBuffer) {
  const sr = ctx.sampleRate;
  const o = new OfflineAudioContext(2, Math.ceil(sr * (seconds + 0.12)), sr);
  // Warmth: gentle low-pass, then dry + a little generated-impulse reverb.
  const out = o.createBiquadFilter();
  out.type = "lowpass";
  out.frequency.value = 9000;
  const verb = o.createConvolver();
  verb.buffer = impulse;
  const wet = o.createGain();
  wet.gain.value = 0.18;
  out.connect(o.destination);
  out.connect(verb).connect(wet).connect(o.destination);

  const env = (g: AudioParam, t: number, a: number, d: number, attack = 0.004) => {
    g.setValueAtTime(0, t);
    g.linearRampToValueAtTime(a, t + attack);
    g.exponentialRampToValueAtTime(1e-4, t + Math.max(attack + 0.004, d));
  };
  const s: Synth = {
    tone(t, f, d, a, f2, p = WOOD) {
      for (const [r, pa, pd] of p) {
        const osc = o.createOscillator();
        const g = o.createGain();
        osc.frequency.setValueAtTime(f * r, t);
        if (f2) osc.frequency.exponentialRampToValueAtTime(f2 * r, t + d * 0.8);
        env(g.gain, t, a * pa, d * pd);
        osc.connect(g).connect(out);
        osc.start(t);
        osc.stop(t + d + 0.02);
      }
    },
    noise(t, d, a, f, f2, type = "bandpass", q = 1) {
      const src = o.createBufferSource();
      const fl = o.createBiquadFilter();
      const g = o.createGain();
      src.buffer = noise;
      fl.type = type;
      fl.Q.value = q;
      fl.frequency.setValueAtTime(f, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
      env(g.gain, t, a, d, d * 0.35);
      src.connect(fl).connect(g).connect(out);
      src.start(t);
      src.stop(t + d + 0.02);
    },
    // Mallet: wooden/glassy partials plus a soft felt click.
    bar(t, f, d, a) {
      s.tone(t, f, d, a);
      s.noise(t, 0.012, a * 0.25, 2500, 0, "lowpass", 0.7);
    }
  };
  draw(s);
  const buf = await o.startRendering();
  // Normalise to the design peak.
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) for (const v of buf.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
  const k = peak ? (PEAK * level) / peak : 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] *= k;
  }
  return buf;
}

/** Returns the player for `setPlayer`. Sounds become available as they finish rendering (a few ms each). */
export function createEngine(ctx: AudioContext): (name: FeedbackName, opts?: FeedbackOptions) => void {
  const master = ctx.createGain();
  const ui = ctx.createGain(); // UI category bus (the ambient pad has its own, see pad.ts)
  ui.connect(master).connect(ctx.destination);

  const buffers: Record<string, AudioBuffer> = {};
  const noise = noiseBuffer(ctx, 0.5, 1);
  const impulse = noiseBuffer(ctx, 0.35, 2, 3);
  void (async () => {
    for (const [name, [sec, draw, level]] of Object.entries(SOUNDS)) {
      try {
        buffers[name] = await render(ctx, sec, draw, level, noise, impulse);
        if (name === "open") {
          // close = open played backwards
          const b = buffers.open;
          const rev = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
          for (let c = 0; c < b.numberOfChannels; c++) rev.getChannelData(c).set(b.getChannelData(c).slice().reverse());
          buffers.close = rev;
        }
      } catch {
        /* unsupported (very old browser): that sound stays silent */
      }
    }
  })();

  const voices: { src: AudioBufferSourceNode; g: GainNode }[] = [];
  let lastHover = 0;
  let flip = false;

  return (name, opts) => {
    const p = useSensory.getState();
    if (p.muted || !p.ui || (name === "typing" && !p.typing)) return;
    if (ctx.state !== "running") void ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    let key: string = name;
    let gain = 1;
    if (name === "selection") (key = "tap"), (gain = 0.35);
    if (name === "dockHover") {
      if (now - lastHover < 0.06) return;
      lastHover = now;
    }
    if (name === "toggle") {
      // The handler usually runs before the state flips: aria-checked="true" → turning off.
      const state = opts?.el?.getAttribute("aria-checked") ?? opts?.el?.getAttribute("aria-pressed");
      key = (state ? state !== "true" : (flip = !flip)) ? "toggleUp" : "toggleDown";
    }
    const buf = buffers[key];
    if (!buf) return;
    master.gain.value = Math.max(0, Math.min(1, p.volume)) / REF_VOLUME;

    if (voices.length >= MAX_VOICES) {
      const old = voices.shift()!;
      old.g.gain.setTargetAtTime(0, now, 0.008);
      old.src.stop(now + 0.04);
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(g).connect(ui);
    const v = { src, g };
    voices.push(v);
    src.onended = () => {
      const i = voices.indexOf(v);
      if (i >= 0) voices.splice(i, 1);
      g.disconnect();
    };
    src.start(now);
  };
}
