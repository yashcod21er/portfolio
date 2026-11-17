import * as THREE from 'three';

/**
 * The single source of truth for the 3D world's structure.
 *
 * The page is one long scroll. Each chapter owns a length of scroll (in viewport heights);
 * the overlay renders a DOM section of exactly that height, and the world flies the camera
 * along CAMERA_PATH as overall progress goes 0 → 1.
 */
export type ChapterId = 'intro' | 'work' | 'stack' | 'journey' | 'contact';

export interface Chapter {
  id: ChapterId;
  /** short HUD label */
  label: string;
  /** scroll length of this chapter, in viewport heights */
  vh: number;
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro', label: 'Signal', vh: 220 },
  { id: 'work', label: 'Work', vh: 420 },
  { id: 'stack', label: 'Stack', vh: 220 },
  { id: 'journey', label: 'Journey', vh: 280 },
  { id: 'contact', label: 'Contact', vh: 160 },
];

const TOTAL_VH = CHAPTERS.reduce((s, c) => s + c.vh, 0);

/**
 * [start, end] of each chapter in overall progress (0..1).
 *
 * Progress runs over the scrollable distance, (total − 100) vh. A chapter's section pins a
 * full-screen stage, so the chapter starts (local 0) when its section's top reaches the top of
 * the viewport and ends (local 1) when its bottom reaches the viewport bottom, just before the
 * stage unpins. The 100vh between one chapter's end and the next one's start is the hand-off.
 */
const SCROLLABLE_VH = TOTAL_VH - 100;
export const CHAPTER_RANGES: Record<ChapterId, [number, number]> = (() => {
  let acc = 0;
  const out = {} as Record<ChapterId, [number, number]>;
  for (const c of CHAPTERS) {
    out[c.id] = [acc / SCROLLABLE_VH, Math.min(1, (acc + c.vh - 100) / SCROLLABLE_VH)];
    acc += c.vh;
  }
  return out;
})();

/** Which chapter overall progress p falls in, and how far through it (0..1). */
export function chapterAt(p: number): { index: number; id: ChapterId; local: number } {
  for (let i = 0; i < CHAPTERS.length; i++) {
    const [a, b] = CHAPTER_RANGES[CHAPTERS[i].id];
    if (p < b || i === CHAPTERS.length - 1) {
      return { index: i, id: CHAPTERS[i].id, local: THREE.MathUtils.clamp((p - a) / (b - a), 0, 1) };
    }
  }
  return { index: 0, id: 'intro', local: 0 };
}

/** Local progress (0..1) of a given chapter at overall progress p. */
export function chapterLocal(id: ChapterId, p: number) {
  const [a, b] = CHAPTER_RANGES[id];
  return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
}

/**
 * The camera's flight: a gentle snake into -Z through red fog, ~210 units long.
 * Overall progress p maps directly to u = p along this curve (arc-length parameterised).
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0.15, 8.5), // intro: facing the portrait
    new THREE.Vector3(0, 0.4, 2),
    new THREE.Vector3(1.5, 0.9, -14), // into the work corridor
    new THREE.Vector3(-1.5, 1.0, -40),
    new THREE.Vector3(1.5, 0.9, -66),
    new THREE.Vector3(0, 1.4, -92), // stack constellation
    new THREE.Vector3(-2, 1.0, -118), // journey trail
    new THREE.Vector3(2, 0.8, -148),
    new THREE.Vector3(0, 0.5, -178), // approaching the portal
    new THREE.Vector3(0, 0.4, -196),
  ],
  false,
  'catmullrom',
  0.4,
);

/** Camera position at overall progress p. */
export const pathPoint = (p: number, target = new THREE.Vector3()) =>
  CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(p, 0, 1), target);

/** Unit direction of travel at overall progress p. */
export const pathTangent = (p: number, target = new THREE.Vector3()) =>
  CAMERA_PATH.getTangentAt(THREE.MathUtils.clamp(p, 0, 1), target);

/**
 * Where a chapter's 3D content lives: on the path at the chapter's midpoint, pushed `ahead`
 * units further along the direction of travel so the camera flies toward it.
 */
export function chapterAnchor(id: ChapterId, ahead = 8): THREE.Vector3 {
  const [a, b] = CHAPTER_RANGES[id];
  const mid = (a + b) / 2;
  return pathPoint(mid).add(pathTangent(mid).multiplyScalar(ahead));
}

/** The portrait sits in front of the camera's starting position. */
export const PORTRAIT_POSITION = new THREE.Vector3(0, 0.2, 0);
