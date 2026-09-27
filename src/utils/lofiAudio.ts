/**
 * Procedural Web Audio Lo-Fi Beat Synthesizer.
 * Generates an authentic, relaxing chillhop / lo-fi study beat in real-time.
 * - Warm Rhodes EP jazz chords with analog tape wow & flutter
 * - Deep sub-bassline
 * - Cozy vinyl dust crackle & groove noise
 * - Chill boom-bap rhythm (subtle kick, warm rimshot, swung hi-hats)
 * - Zero external MP3 downloads required, 100% offline & zero network delay.
 */

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let masterGain: GainNode | null = null;
let vinylNode: AudioBufferSourceNode | null = null;
let schedulerTimer: number | null = null;
let currentStep = 0;
let nextStepTime = 0;

function getContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// 72 BPM -> 16th note interval = (60 / 72) / 4 ≈ 0.2083 seconds
const BPM = 72;
const SECONDS_PER_BEAT = 60 / BPM;
const SECONDS_PER_16TH = SECONDS_PER_BEAT / 4;

// Lo-Fi Jazz 7th Chord Progression:
// Bar 1: Fmaj7 (F3, A3, C4, E4)
// Bar 2: Em7   (E3, G3, B3, D4)
// Bar 3: Dm7   (D3, F3, A3, C4)
// Bar 4: Cmaj7 (C3, E3, G3, B3)
const CHORDS = [
  { root: 87.31, notes: [174.61, 220.0, 261.63, 329.63] }, // Fmaj7
  { root: 82.41, notes: [164.81, 196.0, 246.94, 293.66] }, // Em7
  { root: 73.42, notes: [146.83, 174.61, 220.0, 261.63] }, // Dm7
  { root: 65.41, notes: [130.81, 164.81, 196.0, 246.94] }, // Cmaj7
];

// Pentatonic top melodies / bell flourishes
const BELL_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6

/**
 * Generate a 3-second looping pink noise buffer for vintage vinyl crackle & tape warmth
 */
function createVinylBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.153852;
    let pink = b0 + b1 + b2 + white * 0.1;

    // Random micro-clicks (vinyl dust pops)
    if (Math.random() < 0.0006) {
      pink += (Math.random() - 0.5) * 4;
    }

    data[i] = pink * 0.04;
  }
  return buffer;
}

/**
 * Trigger a warm electric piano Rhodes chord with analog tape pitch wobble
 */
function playChord(ctx: AudioContext, time: number, chordIndex: number) {
  const target = masterGain;
  if (!target) return;
  const chord = CHORDS[chordIndex % CHORDS.length];

  chord.notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Subtle detune and tape flutter
    const detuneCents = (idx - 1.5) * 3 + (Math.random() - 0.5) * 4;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(detuneCents, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 0.999, time);
    osc2.detune.setValueAtTime(-detuneCents, time);

    // Warm lo-fi electric piano filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.Q.setValueAtTime(1.5, time);

    // Envelope
    const duration = SECONDS_PER_BEAT * 3.6;
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(0.045, time + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.022, time + 0.9);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(target);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + duration);
    osc2.stop(time + duration);
  });
}

/**
 * Trigger mellow deep sub-bass note
 */
function playBass(ctx: AudioContext, time: number, chordIndex: number) {
  const target = masterGain;
  if (!target) return;
  const chord = CHORDS[chordIndex % CHORDS.length];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(chord.root, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, time);

  const duration = SECONDS_PER_BEAT * 1.8;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.07, time + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(target);

  osc.start(time);
  osc.stop(time + duration);
}

/**
 * Trigger lo-fi boom-bap kick drum
 */
function playKick(ctx: AudioContext, time: number) {
  const target = masterGain;
  if (!target) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);

  gain.gain.setValueAtTime(0.08, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

  osc.connect(gain);
  gain.connect(target);

  osc.start(time);
  osc.stop(time + 0.16);
}

/**
 * Trigger warm lo-fi rimshot/snare
 */
function playSnare(ctx: AudioContext, time: number) {
  const target = masterGain;
  if (!target) return;
  // White noise burst
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, time);
  filter.Q.setValueAtTime(1.8, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.04, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(target);

  noiseSource.start(time);
  noiseSource.stop(time + 0.1);
}

/**
 * Trigger subtle lo-fi closed hi-hat
 */
function playHiHat(ctx: AudioContext, time: number, accent: boolean) {
  const target = masterGain;
  if (!target) return;
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(6500, time);

  const gain = ctx.createGain();
  const vol = accent ? 0.02 : 0.012;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(target);

  noiseSource.start(time);
  noiseSource.stop(time + 0.04);
}

/**
 * Trigger gentle crystal bell accent note
 */
function playBell(ctx: AudioContext, time: number) {
  const target = masterGain;
  if (!target) return;
  const freq = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)];

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.02, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);

  osc.connect(gain);
  gain.connect(target);

  osc.start(time);
  osc.stop(time + 0.85);
}

/**
 * Main 16th-note lookahead step sequencer
 */
function scheduleSteps() {
  if (!isPlaying || !audioCtx) return;

  // Look ahead 150ms
  while (nextStepTime < audioCtx.currentTime + 0.15) {
    const stepInBar = currentStep % 16;
    const barIndex = Math.floor(currentStep / 16) % 4;

    // 1. Play Chords on beat 1 of each bar (step 0)
    if (stepInBar === 0) {
      playChord(audioCtx, nextStepTime, barIndex);
      playBass(audioCtx, nextStepTime, barIndex);
    }
    // Secondary Bass hit on beat 3 (step 8)
    if (stepInBar === 8) {
      playBass(audioCtx, nextStepTime, barIndex);
    }

    // 2. Chill Boom-Bap Kick: beat 1 (step 0) & beat 2.5 (step 6) or beat 3.5 (step 10)
    if (stepInBar === 0 || stepInBar === 6) {
      playKick(audioCtx, nextStepTime);
    }

    // 3. Snare / Rimshot: beat 2 (step 4) & beat 4 (step 12)
    if (stepInBar === 4 || stepInBar === 12) {
      playSnare(audioCtx, nextStepTime);
    }

    // 4. Hi-Hats on every 8th note (steps 0, 2, 4, 6, 8, 10, 12, 14) with swing
    if (stepInBar % 2 === 0) {
      const swing = (stepInBar % 4 === 2) ? 0.02 : 0;
      playHiHat(audioCtx, nextStepTime + swing, stepInBar % 4 === 0);
    }

    // 5. Occasional gentle bell accent on off-beats
    if (stepInBar === 10 && Math.random() < 0.6) {
      playBell(audioCtx, nextStepTime);
    }

    nextStepTime += SECONDS_PER_16TH;
    currentStep += 1;
  }

  schedulerTimer = window.setTimeout(scheduleSteps, 30);
}

/**
 * Start Lo-Fi audio playback with smooth fade-in
 */
export function startLofi() {
  if (isPlaying) return;
  try {
    const ctx = getContext();
    isPlaying = true;

    // Master bus
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.8);
    masterGain.connect(ctx.destination);

    // Vinyl crackle loop
    const vinylBuffer = createVinylBuffer(ctx);
    vinylNode = ctx.createBufferSource();
    vinylNode.buffer = vinylBuffer;
    vinylNode.loop = true;

    const vinylFilter = ctx.createBiquadFilter();
    vinylFilter.type = 'lowpass';
    vinylFilter.frequency.setValueAtTime(1400, ctx.currentTime);

    const vinylGain = ctx.createGain();
    vinylGain.gain.setValueAtTime(0.18, ctx.currentTime);

    vinylNode.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(masterGain);
    vinylNode.start(ctx.currentTime);

    // Initialize step sequencer
    currentStep = 0;
    nextStepTime = ctx.currentTime + 0.05;
    scheduleSteps();
  } catch (err) {
    console.error('Failed to start Lo-Fi audio:', err);
    isPlaying = false;
  }
}

/**
 * Stop Lo-Fi audio playback with smooth fade-out
 */
export function stopLofi() {
  if (!isPlaying || !audioCtx) return;
  isPlaying = false;

  if (schedulerTimer !== null) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  if (masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);

    setTimeout(() => {
      try {
        if (vinylNode) {
          vinylNode.stop();
          vinylNode.disconnect();
          vinylNode = null;
        }
        if (masterGain) {
          masterGain.disconnect();
          masterGain = null;
        }
      } catch {
        // Ignore disconnect errors
      }
    }, 700);
  }
}

/**
 * Check if Lo-Fi music is currently playing
 */
export function isLofiActive(): boolean {
  return isPlaying;
}
