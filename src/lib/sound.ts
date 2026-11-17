/**
 * Site sound API. Sound is OFF until the visitor turns it on (browsers block audio
 * before a user gesture anyway). Every function is safe to call at any time: when
 * sound is off, or before the engine exists, calls do nothing.
 *
 * Owned by the chrome agent, which implements the engine (WebAudio, generated
 * sounds, no audio files). Other sections only call the `sfx` functions.
 *
 * Engine graph (built lazily on the first enable, inside a user gesture):
 *
 *   pad  ─┐                       ┌─> reverb (generated impulse) ─┐
 *   sfx  ─┼─> bus gains ──────────┤                               ├─> compressor ─> out
 *         └───────────────────────┴───────────────────────────────┘
 *
 * The pad is two detuned saws through a breathing low-pass, plus band-passed noise.
 * It fades in/out over ~1.2s; the context is suspended when off or when the tab is hidden.
 */
import { create } from 'zustand';

interface SoundState {
  /** the visitor's preference (persisted). Off by default. */
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  /** true while the audio context is actually running (for UI meters) */
  playing: boolean;
}

const PREF_KEY = 'yh:sound';

function readPref(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
}

function writePref(on: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* private mode / blocked storage: preference just isn't remembered */
  }
}

export const useSound = create<SoundState>((set) => ({
  enabled: readPref(),
  setEnabled: (enabled) => {
    writePref(enabled);
    set({ enabled });
  },
  playing: false,
}));

type Sfx = {
  /** tiny tick for hovering links/rows */
  hover: () => void;
  /** soft click for buttons / toggles */
  click: () => void;
  /** airy whoosh for big transitions (overlay open, section wipes) */
  whoosh: () => void;
  /** glassy break for the hero shatter */
  shatter: () => void;
  /** reverse shimmer when shards reassemble */
  reform: () => void;
  /** key press for the skills keyboard */
  key: () => void;
};

const noop = () => {};

/** Replaced at runtime by the engine; calls are no-ops until then. */
export const sfx: Sfx = {
  hover: noop,
  click: noop,
  whoosh: noop,
  shatter: noop,
  reform: noop,
  key: noop,
};

/** The engine calls this to install real implementations. */
export function installSfx(impl: Partial<Sfx>) {
  Object.assign(sfx, impl);
}

/* =============================================================================================
   Engine
============================================================================================= */

const PAD_LEVEL = 0.06;
const SFX_LEVEL = 0.55;
const FADE = 1.2;
const HOVER_GAP_MS = 60;

interface Graph {
  ctx: AudioContext;
  padBus: GainNode;
  sfxBus: GainNode;
  verbIn: GainNode;
  noise: AudioBuffer;
}

interface Pad {
  stop: (at: number) => void;
}

let graph: Graph | null = null;
let pad: Pad | null = null;
let padStopTimer = 0;
let lastHover = 0;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function makeNoise(ctx: AudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A small, dark room: stereo noise with a curved exponential tail. */
function makeImpulse(ctx: AudioContext, seconds: number, curve: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
  }
  return buf;
}

function build(): Graph | null {
  if (graph) return graph;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!AC) return null;
  let ctx: AudioContext;
  try {
    ctx = new AC({ latencyHint: 'interactive' });
  } catch {
    return null;
  }

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 24;
  comp.ratio.value = 3;
  comp.attack.value = 0.004;
  comp.release.value = 0.25;
  comp.connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx, 2.4, 3.2);
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.55;
  const verbIn = ctx.createGain();
  verbIn.gain.value = 1;
  verbIn.connect(verb).connect(verbOut).connect(comp);

  const padBus = ctx.createGain();
  padBus.gain.value = 0;
  padBus.connect(comp);

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = SFX_LEVEL;
  sfxBus.connect(comp);

  graph = { ctx, padBus, sfxBus, verbIn, noise: makeNoise(ctx, 2) };
  return graph;
}

/** Ramp a param from wherever it is now. */
function rampTo(p: AudioParam, value: number, at: number, dur: number) {
  p.cancelScheduledValues(at);
  p.setValueAtTime(p.value, at);
  p.linearRampToValueAtTime(value, at + dur);
}

/* --------------------------------------- ambient pad --------------------------------------- */

const A2 = 110;
/** Slow harmonic drift for the second voice: unison, fifth, fourth, octave, minor third. */
const DRIFT = [1, 1.5, 4 / 3, 2, 1.5, 1.189];

function startPad(g: Graph): Pad {
  const { ctx, padBus, verbIn } = g;
  const t = ctx.currentTime;
  const nodes: AudioScheduledSourceNode[] = [];

  const mix = ctx.createGain();
  mix.gain.value = 1;
  mix.connect(padBus);
  const send = ctx.createGain();
  send.gain.value = 0.35;
  mix.connect(send).connect(verbIn);

  // Breathing low-pass shared by both voices.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  lp.Q.value = 1.4;
  lp.connect(mix);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 210;
  lfo.connect(lfoDepth).connect(lp.frequency);
  nodes.push(lfo);

  const voice = (detune: number, pan: number, level: number) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = A2;
    o.detune.value = detune;
    const gn = ctx.createGain();
    gn.gain.value = level;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    o.connect(gn).connect(p).connect(lp);
    nodes.push(o);
    return o;
  };
  voice(-7, -0.35, 0.5);
  const drifting = voice(8, 0.35, 0.42);

  // Air: band-passed noise whose level breathes on its own, slower LFO.
  const air = ctx.createBufferSource();
  air.buffer = g.noise;
  air.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 760;
  bp.Q.value = 0.7;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.16;
  const airLfo = ctx.createOscillator();
  airLfo.frequency.value = 0.07;
  const airDepth = ctx.createGain();
  airDepth.gain.value = 0.1;
  airLfo.connect(airDepth).connect(airGain.gain);
  air.connect(bp).connect(airGain).connect(mix);
  nodes.push(air, airLfo);

  nodes.forEach((n) => n.start(t));

  // Every ~15s the second voice glides somewhere new over a few seconds.
  let step = 0;
  const drift = window.setInterval(() => {
    step = (step + 1) % DRIFT.length;
    drifting.frequency.setTargetAtTime(A2 * DRIFT[step], ctx.currentTime, 2.6);
  }, 15000);

  return {
    stop: (at) => {
      window.clearInterval(drift);
      nodes.forEach((n) => {
        try {
          n.stop(at);
        } catch {
          /* already stopped */
        }
      });
      nodes[0].onended = () => {
        mix.disconnect();
        send.disconnect();
      };
    },
  };
}

/* ----------------------------------------- engine on/off ----------------------------------------- */

function setPlaying(playing: boolean) {
  if (useSound.getState().playing !== playing) useSound.setState({ playing });
}

function engineOn() {
  const g = build();
  if (!g) return;
  window.clearTimeout(padStopTimer);
  const go = () => {
    if (!useSound.getState().enabled) return;
    if (!pad) pad = startPad(g);
    rampTo(g.padBus.gain, PAD_LEVEL, g.ctx.currentTime, FADE);
    setPlaying(true);
  };
  if (g.ctx.state === 'running') go();
  else g.ctx.resume().then(go, () => setPlaying(false));
}

function engineOff() {
  setPlaying(false);
  const g = graph;
  if (!g) return;
  const now = g.ctx.currentTime;
  rampTo(g.padBus.gain, 0, now, FADE);
  window.clearTimeout(padStopTimer);
  padStopTimer = window.setTimeout(() => {
    if (useSound.getState().enabled) return;
    pad?.stop(g.ctx.currentTime + 0.05);
    pad = null;
    void g.ctx.suspend().catch(() => {});
  }, FADE * 1000 + 150);
}

/** A remembered "on" can only become audible after the next user gesture. */
function armGesture() {
  const events = ['pointerdown', 'keydown', 'touchend'] as const;
  const fire = () => {
    events.forEach((e) => window.removeEventListener(e, fire, true));
    if (useSound.getState().enabled) engineOn();
  };
  events.forEach((e) => window.addEventListener(e, fire, true));
}

/* --------------------------------------------- sfx --------------------------------------------- */

/** Running context when sound is on, else null (every sfx bails on null). */
function live(): Graph | null {
  if (!useSound.getState().enabled || !graph || graph.ctx.state !== 'running') return null;
  return graph;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Exponential attack/decay envelope on a fresh gain node. */
function envGain(ctx: AudioContext, t: number, peak: number, attack: number, decay: number) {
  const gn = ctx.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(peak, t + attack);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return gn;
}

function tone(
  g: Graph,
  opts: {
    type?: OscillatorType;
    freq: number;
    to?: number;
    t: number;
    peak: number;
    attack?: number;
    decay: number;
    dest?: AudioNode;
    verb?: number;
  },
) {
  const { ctx } = g;
  const attack = opts.attack ?? 0.003;
  const o = ctx.createOscillator();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(opts.freq, opts.t);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, opts.t + attack + opts.decay);
  const gn = envGain(ctx, opts.t, opts.peak, attack, opts.decay);
  o.connect(gn).connect(opts.dest ?? g.sfxBus);
  if (opts.verb) {
    const s = ctx.createGain();
    s.gain.value = opts.verb;
    gn.connect(s).connect(g.verbIn);
  }
  o.start(opts.t);
  o.stop(opts.t + attack + opts.decay + 0.05);
  o.onended = () => gn.disconnect();
}

function noiseBurst(
  g: Graph,
  opts: {
    t: number;
    dur: number;
    filter: BiquadFilterType;
    freq: number;
    q?: number;
    gain: GainNode;
    pan?: StereoPannerNode;
  },
) {
  const { ctx } = g;
  const src = ctx.createBufferSource();
  src.buffer = g.noise;
  const f = ctx.createBiquadFilter();
  f.type = opts.filter;
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 0.8;
  src.connect(f).connect(opts.gain);
  if (opts.pan) opts.gain.connect(opts.pan);
  const offset = Math.random() * Math.max(0, g.noise.duration - opts.dur - 0.05);
  src.start(opts.t, offset, opts.dur + 0.05);
  src.onended = () => {
    opts.gain.disconnect();
    opts.pan?.disconnect();
  };
  return f;
}

const engineSfx: Sfx = {
  hover() {
    const g = live();
    if (!g) return;
    const now = performance.now();
    if (now - lastHover < HOVER_GAP_MS) return;
    lastHover = now;
    tone(g, { freq: rand(2100, 2500), to: 1700, t: g.ctx.currentTime, peak: 0.045, attack: 0.002, decay: 0.028 });
  },

  click() {
    const g = live();
    if (!g) return;
    const t = g.ctx.currentTime;
    // body: a short pitched-down sine "thock"
    tone(g, { freq: 210, to: 92, t, peak: 0.32, attack: 0.002, decay: 0.11 });
    // contact: a tiny dull transient on top
    const gn = envGain(g.ctx, t, 0.12, 0.001, 0.018);
    gn.connect(g.sfxBus);
    noiseBurst(g, { t, dur: 0.03, filter: 'lowpass', freq: 1400, gain: gn });
  },

  whoosh() {
    const g = live();
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    const dur = 0.95;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.22, t + 0.36);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(-0.6, t);
    pan.pan.linearRampToValueAtTime(0.6, t + dur);
    pan.connect(g.sfxBus);
    const send = ctx.createGain();
    send.gain.value = 0.25;
    pan.connect(send).connect(g.verbIn);
    const f = noiseBurst(g, { t, dur, filter: 'bandpass', freq: 320, q: 1.3, gain: gn, pan });
    f.frequency.setValueAtTime(320, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.4);
    f.frequency.exponentialRampToValueAtTime(520, t + dur);
  },

  shatter() {
    const g = live();
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    // glassy crack: bright noise with a fast decay, partly into the room
    const gn = envGain(ctx, t, 0.38, 0.002, 0.42);
    gn.connect(g.sfxBus);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    gn.connect(send).connect(g.verbIn);
    noiseBurst(g, { t, dur: 0.5, filter: 'highpass', freq: 2600, q: 0.6, gain: gn });
    // shards: inharmonic high partials, scattered over ~70ms
    for (let i = 0; i < 9; i++) {
      tone(g, {
        type: i % 3 === 0 ? 'triangle' : 'sine',
        freq: rand(2200, 7200),
        t: t + rand(0, 0.07),
        peak: rand(0.025, 0.055),
        attack: 0.001,
        decay: rand(0.12, 0.5),
        verb: 0.6,
      });
    }
    // weight underneath so it isn't all fizz
    tone(g, { freq: 140, to: 60, t, peak: 0.18, decay: 0.22 });
  },

  reform() {
    const g = live();
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    const dur = 0.75;
    // reversed shimmer: partials swell up (instead of decaying), rising, then cut
    for (let i = 0; i < 7; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const f0 = rand(900, 2600);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * rand(1.4, 1.9), t + dur);
      const gn = ctx.createGain();
      const start = t + rand(0, 0.18);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.setValueAtTime(0.0001, start);
      gn.gain.exponentialRampToValueAtTime(rand(0.02, 0.045), t + dur);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      o.connect(gn).connect(g.sfxBus);
      const s = ctx.createGain();
      s.gain.value = 0.4;
      gn.connect(s).connect(g.verbIn);
      o.start(t);
      o.stop(t + dur + 0.1);
      o.onended = () => gn.disconnect();
    }
    // reversed noise swell
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.14, t + dur);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
    gn.connect(g.sfxBus);
    const f = noiseBurst(g, { t, dur: dur + 0.05, filter: 'highpass', freq: 1800, q: 0.5, gain: gn });
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + dur);
    // landing tick
    tone(g, { freq: 1900, to: 1500, t: t + dur, peak: 0.08, decay: 0.06, verb: 0.3 });
  },

  key() {
    const g = live();
    if (!g) return;
    const { ctx } = g;
    const t = ctx.currentTime;
    const v = rand(0.85, 1.15);
    // switch click: narrow, bright transient
    const click = envGain(ctx, t, 0.22 * v, 0.001, 0.012);
    click.connect(g.sfxBus);
    noiseBurst(g, { t, dur: 0.02, filter: 'bandpass', freq: 3800 * v, q: 2.2, gain: click });
    // keycap bottoming out
    tone(g, { freq: 150 * v, to: 95, t: t + 0.004, peak: 0.12, attack: 0.001, decay: 0.035 });
    // faint release a beat later
    const rel = envGain(ctx, t + 0.075, 0.06, 0.001, 0.01);
    rel.connect(g.sfxBus);
    noiseBurst(g, { t: t + 0.075, dur: 0.015, filter: 'bandpass', freq: 2900 * v, q: 2, gain: rel });
  },
};

/* --------------------------------------------- boot --------------------------------------------- */

if (typeof window !== 'undefined') {
  installSfx(engineSfx);

  useSound.subscribe((s, prev) => {
    if (s.enabled === prev.enabled) return;
    if (s.enabled) engineOn();
    else engineOff();
  });

  if (useSound.getState().enabled) armGesture();

  document.addEventListener('visibilitychange', () => {
    const g = graph;
    if (!g || !useSound.getState().enabled) return;
    if (document.hidden) {
      void g.ctx.suspend().catch(() => {});
      setPlaying(false);
    } else engineOn();
  });
}
