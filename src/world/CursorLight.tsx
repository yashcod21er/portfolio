import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HEX, lin } from './config';
import { INTRO_END } from './cameraPath';
import { PORTRAIT_POSITION } from './layout';
import { runtime } from './runtime';
import { useWorld } from './store';

const { damp, clamp } = THREE.MathUtils;

/** How far into the world the light rides along the pointer ray. */
const REACH = 8;
const MIN_REACH = 3;

const glowVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const glowFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOn;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r2 = dot(p, p);
  float a = exp(-r2 * 18.0) * 0.6 + exp(-r2 * 60.0) * 0.25;
  gl_FragColor = vec4(uColor * a * uOn, 1.0);
}
`;

/**
 * CURSOR LIGHT: the pointer is a red flashlight into the world. A light rides the
 * camera → pointer ray ~8 units deep (closer when his portrait is in front, so it grazes his
 * face), lagging a touch behind the pointer. Shaders read `runtime.cursorLight` /
 * `runtime.cursorLightOn` (portrait relief, ground, embers); a faint haze glow marks the spot.
 * Not mounted on touch devices.
 */
export default function CursorLight() {
  const glow = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: { uColor: { value: lin(HEX.signal).multiplyScalar(1.4) }, uOn: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  const v = useMemo(
    () => ({ ray: new THREE.Raycaster(), ndc: new THREE.Vector2(), target: new THREE.Vector3(), init: false, on: 0 }),
    [],
  );

  useEffect(
    () => () => {
      runtime.cursorLightOn = 0;
    },
    [],
  );

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const { x, y } = useWorld.getState().pointer;
    const active = x !== 0 || y !== 0;

    v.ndc.set(x, y);
    camera.updateMatrixWorld();
    v.ray.setFromCamera(v.ndc, camera);
    const o = v.ray.ray.origin;
    const d = v.ray.ray.direction;
    let reach = REACH;
    // during the intro, stop just in front of his face so the light rakes across the relief
    if (runtime.progress < INTRO_END * 0.6 && d.z < -0.05) {
      const hit = (PORTRAIT_POSITION.z + 1.1 - o.z) / d.z;
      if (hit > 0) reach = Math.min(reach, hit);
    }
    reach = Math.max(MIN_REACH, reach);
    v.target.copy(o).addScaledVector(d, reach);

    if (!v.init) {
      v.init = true;
      runtime.cursorLight.copy(v.target);
    }
    // lag: the light follows the pointer like something with a little mass
    runtime.cursorLight.x = damp(runtime.cursorLight.x, v.target.x, 7, dt);
    runtime.cursorLight.y = damp(runtime.cursorLight.y, v.target.y, 7, dt);
    runtime.cursorLight.z = damp(runtime.cursorLight.z, v.target.z, 7, dt);

    v.on = damp(v.on, active ? 1 : 0, 3, dt);
    runtime.cursorLightOn = v.on * runtime.arrival * (1 - clamp(runtime.warp * 0.6, 0, 0.6));

    const g = glow.current;
    if (g) {
      g.position.copy(runtime.cursorLight);
      g.quaternion.copy(camera.quaternion);
      mat.uniforms.uOn.value = runtime.cursorLightOn * 0.2;
      g.visible = runtime.cursorLightOn > 0.01;
    }
  });

  return (
    <mesh ref={glow} material={mat} frustumCulled={false} renderOrder={5}>
      <planeGeometry args={[1.6, 1.6]} />
    </mesh>
  );
}
