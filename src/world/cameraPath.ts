import * as THREE from 'three';
import { CHAPTER_RANGES, PORTRAIT_POSITION, pathPoint } from './layout';

/** End of the intro chapter in overall progress. */
export const INTRO_END = CHAPTER_RANGES.intro[1];

/** Intro-local progress where the slow push-in ends and the plunge through the portrait begins. */
export const HOLD_SPLIT = 0.45;

/** How close the push-in brings the camera to the portrait plane. */
const HOLD_DIST = 6;

/** The point the camera studies during the intro: his face, a little above the plane centre. */
export const PORTRAIT_FACE = new THREE.Vector3(
  PORTRAIT_POSITION.x,
  PORTRAIT_POSITION.y + 0.32,
  PORTRAIT_POSITION.z + 0.2,
);

/** Path parameter where the camera stands HOLD_DIST in front of the portrait. */
const HOLD_U = (() => {
  const v = new THREE.Vector3();
  let lo = 0;
  let hi = INTRO_END;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (pathPoint(mid, v).z - PORTRAIT_POSITION.z > HOLD_DIST) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/** Hermite ease from rest (slope 0) to slope m1 at t = 1. */
const hermite = (t: number, m1: number) => 3 * t * t - 2 * t * t * t + m1 * (t * t * t - t * t);

/**
 * Where on CAMERA_PATH the camera is at overall progress p.
 *
 * After the intro this is simply p (so chapterAnchor() lines up). During the intro the
 * camera first pushes in slowly toward the portrait (it must still be in front of it when it
 * disintegrates), then plunges through the burst and catches up with the path exactly at
 * the intro's end, at matching speed.
 */
export function cameraU(p: number): number {
  if (p >= INTRO_END) return p;
  const local = Math.max(p, 0) / INTRO_END;
  if (local <= HOLD_SPLIT) {
    const t = local / HOLD_SPLIT;
    return HOLD_U * t * t * (3 - 2 * t);
  }
  const t = (local - HOLD_SPLIT) / (1 - HOLD_SPLIT);
  const span = INTRO_END - HOLD_U;
  const m1 = (INTRO_END * (1 - HOLD_SPLIT)) / span;
  return HOLD_U + span * hermite(t, m1);
}
