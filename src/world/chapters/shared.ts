import { useLayoutEffect, type RefObject } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { CHAPTER_RANGES, pathPoint, pathTangent, type ChapterId } from '../layout';
import { useWorld } from '../store';

/* ---------------------------------------------------------------------------------------------
   Palette (DESIGN.md tokens). Bright reds are pushed above 1.0 so Bloom catches them.
--------------------------------------------------------------------------------------------- */
export const SIGNAL = '#ff2a1f';
export const SIGNAL_DEEP = '#8f0d0a';
export const BONE = '#f3ece8';
export const MUTE = '#9a8c8a';

/** Signal red multiplied above 1.0 for bloom (pair with toneMapped={false}). */
export const hot = (mult: number, hex: string = SIGNAL) => new THREE.Color(hex).multiplyScalar(mult);

/** Bright text colours (rendered with toneMapped=false). */
export const BONE_HOT = new THREE.Color(BONE).multiplyScalar(1.15);
/** Bone for 3D labels: bright enough to read as bone (not grey) after ACES, just under heavy bloom. */
export const BONE_TEXT = new THREE.Color(BONE).multiplyScalar(1.3);
/** Signal red for 3D labels: pushed so it reads as a lit red, with a soft bloom. */
export const RED_TEXT = new THREE.Color(SIGNAL).multiplyScalar(2.4);

/**
 * Base material for every 3D label (pass as `material` to drei <Text>; troika derives its own
 * copy per text, so `color` / `fillOpacity` stay per label). No fog: labels are only shown
 * when they should be read, and fog would grey them out.
 */
export const TEXT_MAT = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  side: THREE.DoubleSide,
  transparent: true,
  fog: false,
  toneMapped: false,
  depthWrite: false,
});

export const UP = new THREE.Vector3(0, 1, 0);

/** Troika text mesh (drei <Text> ref): properties are applied every render, no re-sync needed. */
export type TroikaText = THREE.Mesh & {
  fillOpacity: number;
  outlineOpacity: number;
  color: THREE.ColorRepresentation;
};

/* ---------------------------------------------------------------------------------------------
   Shared, damped progress for all chapters. Updated once per frame by <ProgressTracker/>
   (useFrame priority -1, so it runs before every chapter's own frame callback).
--------------------------------------------------------------------------------------------- */
export const track = {
  /** damped overall progress (eases toward useWorld.progress) */
  p: 0,
  /** elapsed seconds */
  time: 0,
  initialised: false,
};

export function stepTrack(dt: number, elapsed: number) {
  const raw = useWorld.getState().progress;
  if (!track.initialised) {
    track.p = raw;
    track.initialised = true;
  } else {
    track.p = THREE.MathUtils.damp(track.p, raw, 5, Math.min(dt, 0.1));
  }
  track.time = elapsed;
}

/** Warm-up frames: a freshly mounted chapter renders once so shaders compile and textures upload up front. */
export const WARMUP_FRAMES = 3;

/**
 * Whether a chapter's content should be rendered: within its progress range, plus a margin
 * before (content is seen from a distance as the camera approaches) and after.
 */
export function chapterActive(id: ChapterId, p: number, before = 0.08, after = 0.04, warm?: { frames: number }) {
  // render a chapter for its first few frames after mounting (it may mount late, after Suspense)
  if (warm && warm.frames++ < WARMUP_FRAMES) return true;
  const [a, b] = CHAPTER_RANGES[id];
  return p > a - before && p < b + after;
}

/** Map overall progress to a chapter-local t (unclamped helpers are clamped here). */
export const localToGlobal = (id: ChapterId, t: number) => {
  const [a, b] = CHAPTER_RANGES[id];
  return a + (b - a) * t;
};

export const smooth = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);

/** A moving frame on the camera path: position, direction of travel, horizontal side, local up. */
export interface PathFrame {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
  up: THREE.Vector3;
}

export function pathFrame(p: number): PathFrame {
  const pos = pathPoint(p);
  const tangent = pathTangent(p);
  const side = new THREE.Vector3().crossVectors(tangent, UP).normalize();
  const up = new THREE.Vector3().crossVectors(side, tangent).normalize();
  return { pos, tangent, side, up };
}

/** Quaternion whose local -Z points along `dir` (camera-style), +Y close to world up. */
export function facingQuat(dir: THREE.Vector3) {
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, UP);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/** Deterministic pseudo-random generator so the world composes identically every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------------------------------
   Soft radial glow card (additive). Used for halos behind screens, beacons, waypoints.
--------------------------------------------------------------------------------------------- */
const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFalloff;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    float g = pow(max(1.0 - d, 0.0), uFalloff);
    gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
  }
`;

export function makeGlowMaterial(color: THREE.ColorRepresentation = SIGNAL, intensity = 1, falloff = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uFalloff: { value: falloff },
    },
    vertexShader: glowVert,
    fragmentShader: glowFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

/** Shared unit plane for glow cards. */
export const GLOW_PLANE = new THREE.PlaneGeometry(1, 1);

/**
 * Compile a chapter's shaders as soon as it mounts (off-screen and frustum-culled objects too),
 * so the first time the camera reaches it there is no compile hitch.
 */
export function usePrecompile(ref: RefObject<THREE.Object3D | null>) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const o = ref.current;
    if (!o) return;
    gl.compileAsync(o, camera, scene).catch(() => {
      /* non-fatal: shaders will compile on first render instead */
    });
  }, [gl, camera, scene, ref]);
}
