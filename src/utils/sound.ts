/**
 * Procedural Web Audio API sound generator for tactile creative studio interactions.
 * Zero external audio files required. Completely silent if audio is muted or disabled.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundEffectType =
  | 'hover'
  | 'click'
  | 'modal'
  | 'command'
  | 'boot'
  | 'thock'
  | 'lamp'
  | 'sip'
  | 'tape'
  | 'victory';

export const playSound = (type: SoundEffectType, enabled: boolean) => {
  if (!enabled || typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'hover':
        // Extremely subtle pentatonic blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.04);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'click':
        // Soft tactile click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.05);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
        break;

      case 'thock':
        // Deep mechanical keyboard switch "thock"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.045);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'lamp':
        // Dual-snap desk switch click
        osc.type = 'square';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.04);
        break;

      case 'sip':
        // Soft soothing liquid sip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
        break;

      case 'tape':
        // Mechanical tape deck engage latch
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.07);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'victory': {
        // 8-bit celebratory victory chime
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
          noteGain.gain.setValueAtTime(0.04, now + idx * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.12);
          noteOsc.start(now + idx * 0.08);
          noteOsc.stop(now + idx * 0.08 + 0.13);
        });
        break;
      }

      case 'modal':
        // Gentle dual-tone chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
        break;

      case 'command':
        // Subtle cyber pulse
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
        break;

      case 'boot':
        // Studio startup chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.35);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
    }
  } catch {
    // Fail silently
  }
};
