import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOG_DENSITY, HEX, lin } from './config';
import { runtime } from './runtime';

/**
 * Drifting embers: one Points draw. Each particle has a fixed world position (plus a slow
 * drift) wrapped into a box that travels just ahead of the camera, so the field is endless,
 * keeps true parallax as the camera flies through it, and never pops (edges fade).
 *
 * During a chapter warp (and, lightly, on fast scrolls) the same particles are drawn a second
 * time as speed streaks: instanced quads stretched along the direction of travel. Near the
 * cursor light they flare, like dust in a flashlight beam.
 */
const emberCommon = /* glsl */ `
attribute vec4 aRand;
uniform float uTime;
uniform vec3 uCenter;
uniform vec3 uBox;
uniform float uViewScale;
uniform vec3 uSignal;
uniform float uFogDensity;
uniform float uBoost;
uniform vec4 uLight;

/** World position of ember with normalised home position h; edge = fade at the box walls. */
vec3 emberWorld(vec3 h, out float edge) {
  vec3 drift = vec3(
    sin(uTime * 0.13 + aRand.x * 6.283) * 0.8,
    uTime * (0.1 + 0.28 * aRand.y),
    cos(uTime * 0.1 + aRand.z * 6.283) * 0.6
  );
  vec3 w = h * uBox + drift;
  vec3 rel = mod(w - uCenter + uBox * 0.5, uBox) - uBox * 0.5;
  vec3 e = abs(rel) / (uBox * 0.5);
  edge = 1.0 - smoothstep(0.72, 1.0, max(max(e.x, e.y), e.z));
  return uCenter + rel;
}

vec3 emberColor() {
  float big = step(0.985, aRand.w);
  float hot = step(0.9, aRand.x);
  return mix(uSignal * (1.6 + 3.0 * aRand.z), vec3(1.0, 0.45, 0.2) * 4.5, hot) * mix(1.0, 0.22, big);
}

/** 0..1: how strongly the cursor light catches this ember. */
float lightCatch(vec3 wp) {
  vec3 d = wp - uLight.xyz;
  return exp(-dot(d, d) / 3.2) * uLight.w;
}
`;

const vert = /* glsl */ `
${emberCommon}
varying vec3 vCol;
varying float vAlpha;
void main() {
  float edge;
  vec3 wp = emberWorld(position, edge);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  float dist = -mv.z;
  gl_Position = projectionMatrix * mv;

  float big = step(0.985, aRand.w);
  float lc = lightCatch(wp);
  float size = mix(0.016 + 0.03 * aRand.z, 0.14, big) * (1.0 + lc * 0.8);
  float ps = size * uViewScale / max(dist, 0.1);
  gl_PointSize = clamp(ps, 1.0, 36.0);

  float tw = 0.5 + 0.5 * sin(uTime * (0.8 + 2.6 * aRand.x) + aRand.y * 40.0);
  vCol = emberColor() * (1.0 + lc * 3.5);
  float fog = exp(-pow(uFogDensity * dist, 2.0));
  vAlpha = edge * fog * smoothstep(0.25, 1.4, dist) * (0.35 + 0.65 * tw) * min(ps, 1.0) * uBoost
    + lc * edge * fog * 0.6;
}
`;
const frag = /* glsl */ `
varying vec3 vCol;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c) * 4.0;
  if (r > 1.0) discard;
  gl_FragColor = vec4(vCol, exp(-r * 3.0) * vAlpha);
}
`;

/** Streak quad: position.x = 0 (head) .. 1 (tail), position.y = -1 .. 1 across. */
const streakVert = /* glsl */ `
${emberCommon}
attribute vec3 aHome;
uniform float uStreak;
uniform vec3 uDir;
uniform vec2 uRes;
varying vec3 vCol;
varying float vAlpha;
varying vec2 vQ;
void main() {
  float edge;
  vec3 wp = emberWorld(aHome, edge);
  // the trail points where the ember came from relative to the camera: further along the path
  float len = uStreak * (1.2 + 6.5 * aRand.y * aRand.y + 2.5 * step(0.9, aRand.x));
  vec3 tp = wp + uDir * len;
  vec4 h = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  vec4 t = projectionMatrix * viewMatrix * vec4(tp, 1.0);
  vQ = position.xy;
  if (h.w < 0.2 || t.w < 0.2) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vCol = vec3(0.0);
    return;
  }
  vec2 hs = h.xy / h.w;
  vec2 ts = t.xy / t.w;
  vec2 dpx = (ts - hs) * uRes * 0.5;
  float lpx = length(dpx);
  vec2 dir = lpx > 1e-3 ? dpx / lpx : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);

  float big = step(0.985, aRand.w);
  float size = mix(0.016 + 0.03 * aRand.z, 0.1, big);
  float ps = size * uViewScale / max(h.w, 0.1);
  float wpx = clamp(ps * 0.55, 0.9, 3.2);

  vec2 s = mix(hs, ts, position.x) + nrm * position.y * wpx / (uRes * 0.5);
  float z = mix(h.z / h.w, t.z / t.w, position.x);
  gl_Position = vec4(s, z, 1.0);

  float fog = exp(-pow(uFogDensity * h.w, 2.0));
  vCol = mix(emberColor(), vec3(1.0, 0.62, 0.5) * 3.0, 0.25 * uStreak);
  // short streaks stay faint (no smeared blobs); long ones carry the energy
  // about half the field streaks fully, the rest stays a faint drizzle: depth, not noise
  float lead = mix(0.25, 1.0, step(0.48, aRand.z));
  vAlpha = edge * fog * smoothstep(0.4, 2.0, h.w) * smoothstep(2.0, 14.0, lpx) * min(uStreak * 1.6, 1.0) * 0.8 * lead;
}
`;
const streakFrag = /* glsl */ `
varying vec3 vCol;
varying float vAlpha;
varying vec2 vQ;
void main() {
  float across = 1.0 - vQ.y * vQ.y;
  float along = pow(1.0 - vQ.x, 1.6);
  gl_FragColor = vec4(vCol, across * along * vAlpha);
}
`;

const BOX = new THREE.Vector3(28, 14, 46);

function emberArrays(count: number) {
  const pos = new Float32Array(count * 3);
  const rnd = new Float32Array(count * 4);
  for (let i = 0; i < pos.length; i++) pos[i] = Math.random();
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  return { pos, rnd };
}

export default function Embers({ count }: { count: number }) {
  const streakRef = useRef<THREE.Mesh>(null);
  const { geo, mat, streakGeo, streakMat } = useMemo(() => {
    const { pos, rnd } = emberArrays(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));

    const uniforms = {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uBox: { value: BOX },
      uViewScale: { value: 800 },
      uSignal: { value: lin(HEX.signal) },
      uFogDensity: { value: FOG_DENSITY },
      uBoost: { value: 1 },
      uLight: { value: new THREE.Vector4(0, 0, 0, 0) },
      uStreak: { value: 0 },
      uDir: { value: new THREE.Vector3(0, 0, -1) },
      uRes: { value: new THREE.Vector2(1, 1) },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // streaks: the same particles, instanced as stretched quads
    const streakGeo = new THREE.InstancedBufferGeometry();
    // prettier-ignore
    streakGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
    streakGeo.setIndex([0, 1, 2, 0, 2, 3]);
    streakGeo.setAttribute('aHome', new THREE.InstancedBufferAttribute(pos, 3));
    streakGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rnd, 4));
    streakGeo.instanceCount = count;
    const streakMat = new THREE.ShaderMaterial({
      vertexShader: streakVert,
      fragmentShader: streakFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geo, mat, streakGeo, streakMat };
  }, [count]);

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      streakGeo.dispose();
      streakMat.dispose();
    },
    [geo, mat, streakGeo, streakMat],
  );

  const fwd = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock, size, viewport }) => {
    const u = mat.uniforms;
    u.uTime.value = clock.elapsedTime;
    camera.getWorldDirection(fwd);
    (u.uCenter.value as THREE.Vector3).copy(camera.position).addScaledVector(fwd, BOX.z * 0.36);
    u.uViewScale.value = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(21)));
    const streak = runtime.streak;
    // the points thin out as they become streaks
    u.uBoost.value = (0.6 + 0.4 * runtime.arrival) * (1 + runtime.velocity * 0.6) * (1 - streak * 0.55);
    const l = runtime.cursorLight;
    (u.uLight.value as THREE.Vector4).set(l.x, l.y, l.z, runtime.cursorLightOn);
    u.uStreak.value = streak;
    (u.uDir.value as THREE.Vector3).copy(runtime.travel);
    (u.uRes.value as THREE.Vector2).set(size.width * viewport.dpr, size.height * viewport.dpr);
    if (streakRef.current) streakRef.current.visible = streak > 0.015;
  });

  return (
    <>
      <points geometry={geo} material={mat} frustumCulled={false} />
      <mesh ref={streakRef} geometry={streakGeo} material={streakMat} frustumCulled={false} visible={false} />
    </>
  );
}
