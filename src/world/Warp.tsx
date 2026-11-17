import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/smooth';
import { sfx } from '../lib/sound';
import { HEX, lin } from './config';
import { chapterAt } from './layout';
import { runtime } from './runtime';

const { clamp, smoothstep, lerp } = THREE.MathUtils;

/** Envelope timing (seconds): a fast attack, then a long exhale. */
const ATTACK = 0.13;
const LENGTH = 0.85;

const FOG_BASE = lin(HEX.fog);
/** The fog's colour at the peak of a warp: the void briefly glows signal-deep. */
const FOG_FLASH = lin(HEX.signalDeep).multiplyScalar(0.62);

/**
 * CHAPTER WARP: when the camera crosses into the next chapter, a ~0.8 s hyperspace moment.
 * Publishes `runtime.warp` (embers stretch into streaks, the lens kicks wider, bloom and
 * chromatic aberration swell; see Embers / CameraRig / PostFX) and flashes the fog red.
 * Driven by the chapter the camera actually shows (damped progress), scaled by scroll speed.
 */
export default function Warp() {
  const scene = useThree((s) => s.scene);
  const s = useRef({ index: -1, start: -10, amp: 0, lastSfx: -10, t: 0, reduce: prefersReducedMotion() });

  useFrame((_, delta) => {
    const st = s.current;
    // own clock with the rig's frame cap, so a stalled frame never skips the whole moment
    st.t += Math.min(delta, 1 / 20);
    const t = st.t;
    const index = chapterAt(runtime.progress).index;

    if (st.index < 0) st.index = index;
    else if (index !== st.index) {
      st.index = index;
      if (!st.reduce && runtime.readyAt >= 0) {
        const amp = 0.6 + 0.4 * runtime.velocity;
        // a second crossing mid-warp (a nav jump) re-arms it without restarting from zero
        const tau = t - st.start;
        st.amp = tau < LENGTH ? Math.max(amp, st.amp) : amp;
        st.start = tau < LENGTH && tau > ATTACK ? t - ATTACK : t;
        if (t - st.lastSfx > 0.45) {
          st.lastSfx = t;
          sfx.whoosh();
        }
      }
    }

    const tau = t - st.start;
    let env = 0;
    if (tau >= 0 && tau < LENGTH) {
      if (tau < ATTACK) {
        const a = tau / ATTACK;
        env = 1 - (1 - a) * (1 - a) * (1 - a);
      } else {
        const d = (tau - ATTACK) / (LENGTH - ATTACK);
        env = Math.pow(1 - d, 2.2);
      }
    }
    runtime.warp = env * st.amp;
    // streaks: the warp, plus a lighter version whenever the scroll is fast on its own
    runtime.streak = st.reduce ? 0 : clamp(Math.max(runtime.warp, smoothstep(runtime.velocity, 0.35, 1) * 0.42), 0, 1);

    // the fog flash: a red breath through the whole void
    const k = clamp(runtime.warp * 0.9, 0, 1);
    runtime.fogColor.r = lerp(FOG_BASE.r, FOG_FLASH.r, k);
    runtime.fogColor.g = lerp(FOG_BASE.g, FOG_FLASH.g, k);
    runtime.fogColor.b = lerp(FOG_BASE.b, FOG_FLASH.b, k);
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) fog.color.copy(runtime.fogColor);
  }, -1);

  return null;
}
