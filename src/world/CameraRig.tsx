import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { pathPoint, pathTangent } from './layout';
import { useWorld } from './store';
import { cameraU, HOLD_SPLIT, INTRO_END, PORTRAIT_FACE } from './cameraPath';
import { runtime } from './runtime';

const { damp, clamp, smoothstep } = THREE.MathUtils;
const UP = new THREE.Vector3(0, 1, 0);
const BASE_FOV = 42;
/** Intro lens shift, in NDC: his face sits at ~72% across (wide) or ~30% down (narrow). */
const SHIFT_X = 0.44;
const SHIFT_Y = 0.42;
/** How far the idle push-in drifts toward his face over the first ~half minute. */
const CREEP = 0.9;

/**
 * Flies the camera along CAMERA_PATH. Scroll progress is damped as a scalar (so the camera
 * stays on the curve instead of cutting corners), the gaze leads the path, the pointer adds
 * parallax, curves add a little bank, and an idle breath keeps the frame alive.
 * Runs before every other frame callback and publishes `runtime` for them.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera);
  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      look: new THREE.Vector3(),
      t0: new THREE.Vector3(),
      t1: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
    }),
    [],
  );
  const s = useRef({ init: false, prev: 0, px: 0, py: 0, roll: 0, lookW: 0, fov: 0, sx: 0, sy: 0, w: 0, h: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const st = s.current;
    const { progress, pointer } = useWorld.getState();
    const t = state.clock.elapsedTime;

    if (!st.init) {
      st.init = true;
      runtime.progress = progress;
      st.prev = progress;
    }
    runtime.progress = damp(runtime.progress, progress, 3.4, dt);
    if (Math.abs(runtime.progress - progress) < 1e-5) runtime.progress = progress;
    const speed = Math.abs(runtime.progress - st.prev) / Math.max(dt, 1e-3);
    st.prev = runtime.progress;
    runtime.velocity = damp(runtime.velocity, clamp(speed / 0.2, 0, 1), 5, dt);

    // arrival: a slow dolly out of the dark once the scene is shown
    if (runtime.readyAt >= 0) {
      const a = clamp((t - runtime.readyAt - 0.35) / 3.4, 0, 1);
      runtime.arrival = 1 - Math.pow(1 - a, 3);
    }

    const p = runtime.progress;
    const u = cameraU(p);
    runtime.camU = u;
    pathPoint(u, v.pos);

    // gaze: the portrait during the push-in, then the path ahead
    pathTangent(u, v.t0);
    if (u + 0.015 <= 1) pathPoint(u + 0.015, v.ahead);
    else v.ahead.copy(v.pos).addScaledVector(v.t0, 3);
    const introLocal = p / INTRO_END;
    const lookW = p >= INTRO_END ? 1 : smoothstep(introLocal, HOLD_SPLIT - 0.03, 0.66);
    st.lookW = lookW;
    v.look.lerpVectors(PORTRAIT_FACE, v.ahead, lookW);
    runtime.travel.copy(v.t0);

    // the intro hold: a slow, continuous push-in toward his face while the page rests
    // (fades out as the scroll-driven push-in takes over)
    if (runtime.readyAt >= 0 && p < INTRO_END) {
      const since = Math.max(0, t - runtime.readyAt - 1.2);
      const creep = (1 - Math.exp(-since / 16)) * CREEP * (1 - smoothstep(introLocal, 0, HOLD_SPLIT));
      v.t1.subVectors(PORTRAIT_FACE, v.pos).normalize();
      v.pos.addScaledVector(v.t1, creep);
    }

    // pointer parallax (smoothed), in the camera's own frame
    st.px = damp(st.px, pointer.x, 2.6, dt);
    st.py = damp(st.py, pointer.y, 2.6, dt);
    v.right.crossVectors(v.t0, UP).normalize();
    v.up.crossVectors(v.right, v.t0).normalize();
    v.look.addScaledVector(v.right, st.px * 0.6).addScaledVector(v.up, st.py * 0.35);
    v.pos.addScaledVector(v.right, st.px * 0.22).addScaledVector(v.up, st.py * 0.1);

    // breathing
    v.pos.x += Math.sin(t * 0.37) * 0.03;
    v.pos.y += Math.sin(t * 0.61) * 0.035;

    // arrival dolly (from further back and a touch higher)
    const back = 1 - runtime.arrival;
    v.pos.z += back * 4.2;
    v.pos.y += back * 0.5;

    // bank into curves: sign of the turn from the tangent's change
    pathTangent(Math.min(u + 0.03, 1), v.t1);
    const turn = v.t0.x * v.t1.z - v.t0.z * v.t1.x;
    const rollTarget = clamp(-turn * 7, -0.12, 0.12) - st.px * 0.025 + Math.sin(t * 0.23) * 0.006;
    st.roll = damp(st.roll, rollTarget, 2.2, dt);

    camera.position.copy(v.pos);
    camera.up.copy(UP);
    camera.lookAt(v.look);
    camera.rotateZ(st.roll);

    // ---- lens: poster framing during the intro + the warp's FOV kick
    // A lens shift (not a rotation) slides his face into the right of the frame on wide
    // screens, or the upper half on narrow ones, leaving room for the headline; it relaxes to
    // centre as the camera plunges through him.
    const W = state.size.width;
    const H = state.size.height;
    const shiftW = p >= INTRO_END ? 0 : 1 - smoothstep(introLocal, HOLD_SPLIT - 0.05, 0.62);
    const narrow = W < 768 || W / H < 0.9;
    const sx = narrow ? 0 : SHIFT_X * shiftW;
    const sy = narrow ? SHIFT_Y * shiftW : 0;
    const fov = BASE_FOV + runtime.warp * 9;
    const cam = camera as THREE.PerspectiveCamera;
    if (
      cam.isPerspectiveCamera &&
      (Math.abs(fov - st.fov) > 1e-3 || Math.abs(sx - st.sx) > 1e-4 || Math.abs(sy - st.sy) > 1e-4 || W !== st.w || H !== st.h)
    ) {
      st.fov = fov;
      st.sx = sx;
      st.sy = sy;
      st.w = W;
      st.h = H;
      cam.fov = fov;
      if (sx !== 0 || sy !== 0) cam.setViewOffset(W, H, (-sx * W) / 2, (sy * H) / 2, W, H);
      else if (cam.view) cam.clearViewOffset();
      else cam.updateProjectionMatrix();
    }
  }, -2);

  return null;
}
