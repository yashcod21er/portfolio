/**
 * Mutable bag shared between the DOM hero (GSAP timelines, pointer listeners) and the
 * WebGL portrait (read every frame). Plain object on purpose: no React re-renders.
 */
export interface PortraitFx {
  /** 0 → 1 as the hero scrolls out (zoom + slice dissolve) */
  scroll: number;
  /** 0 → 1 intro zoom-settle */
  intro: number;
  /** last pointer position in client px */
  px: number;
  py: number;
  /** pointer currently inside the window */
  pointer: boolean;
  /** last pointer was a mouse / pen (the source lens follows fine pointers only) */
  mouse: boolean;
  /** touch: finger is down on the portrait, show the lens under it */
  lensHold: boolean;
  /** touch: keep the lens up until this performance.now() timestamp after lifting */
  lensUntil: number;
  /** shard displacement: 0 = whole, 1 = broken apart (elastic return overshoots below 0) */
  shatter: number;
  /** 0 → 1 crack rims along the shard edges */
  crack: number;
  /** 1 → 0 impact flash at the break point */
  flash: number;
  /** break point in client px */
  sx: number;
  sy: number;
  /** bumped on every break so the engine re-seeds the shards around the new point */
  shatterId: number;
}

export const createFx = (): PortraitFx => ({
  scroll: 0,
  intro: 1,
  px: -1e4,
  py: -1e4,
  pointer: false,
  mouse: true,
  lensHold: false,
  lensUntil: 0,
  shatter: 0,
  crack: 0,
  flash: 0,
  sx: 0,
  sy: 0,
  shatterId: 0,
});

/** Focal point of the portrait (his face), in image UV with y measured from the top. */
export const PORTRAIT_FOCUS = { x: 0.52, y: 0.4 } as const;
export const PORTRAIT_SRC = '/assets/yash-portrait.webp';
/**
 * Depth map of the portrait (white = near), estimated offline with Depth Anything V2
 * (small) run locally. Drives the hero's 3D relief.
 */
export const PORTRAIT_DEPTH_SRC = '/assets/yash-depth.webp';
export const PORTRAIT_SIZE = { w: 1448, h: 1086 } as const;
/** Intro starts zoomed in by this factor and settles to 1. */
export const INTRO_ZOOM = 1.22;

/** WebGL2 is required by three r163+. Cheap probe, context released immediately. */
export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
