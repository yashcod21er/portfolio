import * as THREE from 'three';
import { HEX } from './config';

/**
 * Per-frame values the scene computes once and shares (mutable, never React state).
 * Written by CameraRig / Warp / CursorLight / SceneReady at the start of each frame; anything
 * inside the canvas may read them in its own useFrame.
 */
export const runtime = {
  /** overall progress (0..1), damped toward useWorld.progress: what the camera actually shows */
  progress: 0,
  /** camera's parameter along CAMERA_PATH (equals `progress` after the intro, see cameraPath.ts) */
  camU: 0,
  /** scroll speed, 0 (still) .. 1 (fast flick) */
  velocity: 0,
  /** 0..1 eased arrival after the scene first appears (camera dolly + portrait reveal) */
  arrival: 0,
  /** clock time when the scene was marked ready (-1 until then) */
  readyAt: -1,
  /** true once the portrait has an image to show */
  portraitReady: false,
  /** unit direction the camera is travelling (path tangent), world space */
  travel: new THREE.Vector3(0, 0, -1),
  /**
   * Chapter-crossing hyperspace envelope, 0..1 (peaks ~0.1 s after the camera enters a new
   * chapter, gone after ~0.8 s). Scaled by scroll speed. Always 0 under reduced motion.
   */
  warp: 0,
  /** speed streak strength 0..1: the warp, plus a little from fast scrolling on its own */
  streak: 0,
  /** the pointer's red "flashlight" in world space (lags the pointer); see CursorLight.tsx */
  cursorLight: new THREE.Vector3(0, 0, 4),
  /** flashlight strength 0..1 (0 on touch / before the scene arrives) */
  cursorLightOn: 0,
  /**
   * The fog colour every world shader reads (shared by reference as a uniform value, and
   * copied into scene.fog). Flashes red during a warp.
   */
  fogColor: new THREE.Color(HEX.fog),
};
