/**
 * Generative ambient music with the Web Audio API — no audio files, no licensing.
 *
 * - Pad: a very slow progression in D (Dmaj9 → Bm9 → Gmaj7♯11 → Em9), ~10s per chord,
 *   each voice two slightly detuned oscillators through a breathing low-pass filter
 *   and a generated reverb, kept very quiet.
 * - Achievement motifs: short bell phrases tuned to each award; the pad ducks under them.
 *
 * Loaded lazily (only when the visitor turns sound on) and always started from a click.
 */

const PAD_LEVEL = 0.05;
const CHORD_SECONDS = 10;

// MIDI note numbers.
const CHORDS: number[][] = [
  [50, 57, 61, 64], // Dmaj9: D3 A3 C#4 E4
  [47, 54, 57, 61], // Bm9:   B2 F#3 A3 C#4
  [43, 50, 54, 61], // Gmaj7#11 (voiced): G2 D3 F#3 C#4
  [52, 59, 62, 66] //  Em9:   E3 B3 D4 F#4
];

// Bell motifs per achievement: [midi note, start beat]. One beat = 0.42s.
const MOTIFS: Record<string, [number, number][]> = {
  // Winner, €3,000 — bright rising D-major arpeggio
  allianz: [
    [74, 0],
    [78, 1],
    [81, 2],
    [86, 3.2]
  ],
  // Multi-agent hackathon — call and response
  periscope: [
    [81, 0],
    [85, 0.6],
    [88, 1.2],
    [85, 2.4],
    [81, 3],
    [86, 3.8]
  ],
  // ISRO × GMRT radio telescope — slow, spacious open fifths
  "isro-gmrt": [
    [62, 0],
    [69, 1.6],
    [76, 3.2],
    [81, 4.8]
  ],
  // Runner-up — softer suspended figure
  "genai-mumbai": [
    [79, 0],
    [84, 1],
    [86, 2],
    [84, 3.2]
  ],
  // Innovator award — gentle pentatonic phrase
  "somaiya-innovator": [
    [76, 0],
    [79, 0.8],
    [81, 1.6],
    [83, 2.4],
    [86, 3.4]
  ]
};
const DEFAULT_MOTIF: [number, number][] = [
  [71, 0],
  [74, 1],
  [78, 2]
];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export class AmbientEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private padBus: GainNode;
  private reverb: ConvolverNode;
  private filter: BiquadFilterNode;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private chordIndex = 0;
  private voices: { osc: OscillatorNode[]; gain: GainNode }[] = [];
  private running = false;

  constructor() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    // Generated reverb impulse: decaying stereo noise (~3s).
    this.reverb = this.ctx.createConvolver();
    const len = Math.floor(this.ctx.sampleRate * 3);
    const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb.buffer = impulse;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);

    // Pad bus → breathing low-pass → dry + reverb.
    this.padBus = this.ctx.createGain();
    this.padBus.gain.value = 1;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.4;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 320;
    lfo.connect(lfoDepth).connect(this.filter.frequency);
    lfo.start();
    this.padBus.connect(this.filter);
    this.filter.connect(this.master);
    this.filter.connect(this.reverb);

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    if (!this.running) return;
    if (document.hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  };

  private playChord() {
    const now = this.ctx.currentTime;
    const attack = 4;
    const hold = CHORD_SECONDS;
    // Fade out the previous chord while the next one swells in (crossfade).
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + attack + 1);
      v.osc.forEach((o) => o.stop(now + attack + 1.2));
    }
    this.voices = CHORDS[this.chordIndex % CHORDS.length].map((note, i) => {
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.32 : 0.22, now + attack);
      gain.connect(this.padBus);
      const osc = [
        { type: "sine" as OscillatorType, detune: 0 },
        { type: "triangle" as OscillatorType, detune: -7 }
      ].map(({ type, detune }) => {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = hz(note);
        o.detune.value = detune;
        o.connect(gain);
        o.start(now);
        o.stop(now + hold + attack + 2);
        return o;
      });
      return { osc, gain };
    });
    this.chordIndex++;
    this.timer = setTimeout(() => this.playChord(), hold * 1000);
  }

  async start() {
    if (this.running) return;
    this.running = true;
    await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(PAD_LEVEL, now + 3);
    this.playChord();
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 1.2);
    await new Promise((r) => setTimeout(r, 1300));
    if (!this.running) await this.ctx.suspend();
  }

  /** Short bell phrase for an achievement; the pad ducks underneath it. */
  playMotif(id: string) {
    if (!this.running) return;
    const notes = MOTIFS[id] ?? DEFAULT_MOTIF;
    const now = this.ctx.currentTime + 0.05;
    const beat = 0.42;
    const end = now + notes[notes.length - 1][1] * beat + 2.5;

    this.padBus.gain.cancelScheduledValues(now);
    this.padBus.gain.setValueAtTime(this.padBus.gain.value, now);
    this.padBus.gain.linearRampToValueAtTime(0.45, now + 0.4);
    this.padBus.gain.linearRampToValueAtTime(1, end + 1.5);

    const bus = this.ctx.createGain();
    bus.gain.value = 2.4; // master is quiet (pad level); bells sit just above the ducked pad
    bus.connect(this.master);
    bus.connect(this.reverb);

    for (const [note, at] of notes) {
      const t = now + at * beat;
      // Bell: fundamental + inharmonic partial, fast attack, long exponential decay.
      for (const [ratio, level] of [
        [1, 0.5],
        [2.76, 0.12]
      ]) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = hz(note) * ratio;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(level, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (ratio === 1 ? 2.4 : 0.9));
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 2.6);
      }
    }
  }
}
