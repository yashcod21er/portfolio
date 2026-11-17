import { CAMERA_PATH, CHAPTER_RANGES } from '../layout';
import { projectsData } from '../../data/projectsData';

/* =============================================================================================
   Choreography of the work chapter's screens: pure functions shared by the 3D screens and the
   DOM overlay, so the project highlighted in the list is always the screen in view.

   The chapter is split into WORK_COUNT equal segments; segment i belongs to screen i. All
   screens live on the RIGHT of the camera path. A screen approaches from deep in the corridor,
   docks ~11–12 units ahead of the camera (gliding along with it, slowly closing in) for its
   whole segment, then swings aside to the right as the next one, already waiting behind it,
   takes over. Positions are pure functions of the camera's chapter-local progress.
============================================================================================= */

/** Number of project screens in the corridor. */
export const WORK_COUNT = Math.min(4, projectsData.length);

const SEG = 1 / WORK_COUNT;

/** Work-local position (0..1) at which each screen is the focus: the middle of its segment. */
export const WORK_STOPS: number[] = Array.from({ length: WORK_COUNT }, (_, i) => (i + 0.5) * SEG);

/**
 * The screen that is docked in front of the camera (the most prominent one) at work-local
 * progress `local` (0..1, values outside are clamped).
 */
export function activeWorkIndex(local: number): number {
  return Math.min(WORK_COUNT - 1, Math.max(0, Math.floor(local * WORK_COUNT)));
}

/* ------------------------------------------ 3D placement ------------------------------------------ */

/** Length of the work chapter along the camera path, in world units. */
export const WORK_LENGTH = (CHAPTER_RANGES.work[1] - CHAPTER_RANGES.work[0]) * CAMERA_PATH.getLength();

/** Distance ahead of the camera (world units) at which each screen docks: alternating depth. */
const DOCK = [11.4, 12.2, 11.6, 12.2];
/** Distance to the right of the path (alternating, so the corridor keeps its rhythm). */
const LATERAL = [2.8, 3.3, 3.45, 3.1];
/** Height above the path. */
const LIFT = [0.45, 0.75, 0.4, 0.7];
/** Dock ramp-in / ramp-out, in segment units relative to the screen's stop (segment = −0.5..0.5). */
const IN0 = -0.78;
const IN1 = -0.5;
const OUT0 = 0.3;
const OUT1 = 0.62;
/** Fraction of the camera's speed a docked screen glides at (1 = locked to the camera). */
const GLIDE = 0.85;
/** How far a dismissed screen slides out to the right, and how far it swings (radians). */
const DISMISS_SLIDE = 2.8;
const DISMISS_RISE = 0.4;
const DISMISS_FOLD = 1.25;

const at = <T>(arr: T[], i: number) => arr[i % arr.length];

/** ∫ smoothstep(t; a, b) dt from −∞ to x. */
function smoothIntegral(x: number, a: number, b: number) {
  if (x <= a) return 0;
  const w = b - a;
  if (x >= b) return w * 0.5 + (x - b);
  const t = (x - a) / w;
  return w * (t * t * t - 0.5 * t * t * t * t);
}

const glideTravel = (x: number) => GLIDE * (smoothIntegral(x, IN0, IN1) - smoothIntegral(x, OUT0, OUT1)) * SEG;

const smoothstep = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface WorkScreenPose {
  /** where the screen is along the path, in work-local units (may be outside 0..1) */
  at: number;
  /** distance ahead of the camera along the path, in world units */
  ahead: number;
  /** offset to the right of the path, world units */
  lateral: number;
  /** offset above the path, world units */
  lift: number;
  /** 0 → 1 as the screen swings away at the end of its segment */
  dismiss: number;
  /** yaw (radians) the screen folds by as it is dismissed */
  fold: number;
  /** 1 while the screen glides docked in front of the camera */
  docked: number;
}

/**
 * Pose of screen `i` when the camera is at work-local progress `camLocal` (unclamped: values
 * before 0 / after 1 are the hand-offs from the intro / to the stack).
 */
export function workScreenPose(i: number, camLocal: number, out: WorkScreenPose): WorkScreenPose {
  const stop = (i + 0.5) * SEG;
  const x = (camLocal - stop) / SEG;
  // anchor: at the start of its segment the screen is exactly DOCK units ahead
  const base = stop - 0.5 * SEG + at(DOCK, i) / WORK_LENGTH - glideTravel(-0.5);
  out.at = base + glideTravel(x);
  out.ahead = (out.at - camLocal) * WORK_LENGTH;
  const d = smoothstep(x, 0.22, 0.58);
  out.dismiss = d;
  out.lateral = at(LATERAL, i) + d * DISMISS_SLIDE;
  out.lift = at(LIFT, i) + d * DISMISS_RISE;
  out.fold = d * DISMISS_FOLD;
  out.docked = smoothstep(x, IN0, IN1) * (1 - smoothstep(x, OUT0, OUT1));
  return out;
}

/** Work-local progress (unclamped) for overall progress p. */
export const workLocalUnclamped = (p: number) =>
  (p - CHAPTER_RANGES.work[0]) / (CHAPTER_RANGES.work[1] - CHAPTER_RANGES.work[0]);
