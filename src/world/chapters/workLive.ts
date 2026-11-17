import * as THREE from 'three';

/**
 * Live state of the project screens, written by WorkScreens every frame and read by WorkCorridor so the
 * corridor (rings, runway lights) catches the red light each lit screen throws.
 */
export const workLive = {
  pos: Array.from({ length: 4 }, () => new THREE.Vector3(0, -999, 0)),
  /** 0..~1.4 light output of each screen (power × flicker, plus the lock-on flash) */
  light: [0, 0, 0, 0],
};
