import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOG_DENSITY, HEX, glslCommon, lin } from './config';
import { INTRO_END } from './cameraPath';
import { PORTRAIT_POSITION } from './layout';
import { runtime } from './runtime';

const GROUND_Y = -3.2;

/* --------------------------------------------------------------------------------------- */
/* Sky: a dark dome that follows the camera. Red haze at the horizon (= fog colour, so     */
/* distant geometry melts into it) and a deep red glow far ahead down the corridor (-Z).   */
/* --------------------------------------------------------------------------------------- */

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const skyFrag = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uFogColor;
uniform vec3 uSignal;
uniform vec3 uSignalDeep;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uFogColor, uInk, smoothstep(-0.02, 0.42, h));
  float ahead = max(dot(d, normalize(vec3(0.0, 0.05, -1.0))), 0.0);
  col += uSignalDeep * (pow(ahead, 14.0) * 0.05 + pow(ahead, 60.0) * 0.1);
  col += uSignal * pow(ahead, 400.0) * 0.25;
  gl_FragColor = vec4(col, 1.0);
}
`;

function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        uniforms: {
          uInk: { value: lin(HEX.ink) },
          uFogColor: { value: runtime.fogColor },
          uSignal: { value: lin(HEX.signal) },
          uSignalDeep: { value: lin(HEX.signalDeep) },
        },
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  return (
    <mesh ref={ref} material={mat} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  );
}

/* --------------------------------------------------------------------------------------- */
/* Ground: a wet black floor far below. No reflection pass: grazing red sky sheen, a       */
/* stretched reflection of the low beam, a red pool under the portrait and one that        */
/* travels with the camera.                                                               */
/* --------------------------------------------------------------------------------------- */

const groundVert = /* glsl */ `
varying vec3 vWorld;
varying float vDist;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const groundFrag = /* glsl */ `
${glslCommon}
uniform vec3 uSignal;
uniform vec3 uSignalDeep;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uTime;
uniform vec4 uBeam;
uniform vec3 uPool;
uniform vec3 uCamPool;
uniform vec4 uCursor;
varying vec3 vWorld;
varying float vDist;
void main() {
  vec3 v = normalize(vWorld - cameraPosition);
  float graze = pow(1.0 - abs(v.y), 5.0);
  vec2 q = vWorld.xz;
  float wet = vnoise(q * vec2(0.9, 0.12)) * 0.6 + vnoise(q * vec2(3.1, 0.5) + 7.0) * 0.4;
  wet = smoothstep(0.25, 0.85, wet);

  vec3 col = vec3(0.0025, 0.0012, 0.0012);
  col += uSignalDeep * graze * (0.18 + 0.4 * wet);

  // the low beam, mirrored and stretched in the wet floor
  float bt = clamp((vWorld.z - uBeam.y) / (uBeam.w - uBeam.y), 0.0, 1.0);
  float bx = mix(uBeam.x, uBeam.z, bt);
  float w = 0.35 + 2.2 * graze;
  float streak = exp(-pow((vWorld.x - bx) / w, 2.0));
  float pulse = 0.6 + 0.4 * sin(vWorld.z * 0.35 + uTime * 2.0);
  col += uSignal * streak * (0.06 + 0.5 * graze) * (0.4 + 0.6 * wet) * pulse;

  // pools of red light
  float dp = length(q - uPool.xy);
  col += uSignal * exp(-dp * dp / 18.0) * uPool.z * (0.45 + 0.55 * wet);
  float dc = length(q - uCamPool.xy);
  col += uSignalDeep * exp(-dc * dc / 60.0) * uCamPool.z * (0.5 + 0.5 * wet);

  // the cursor's flashlight: a soft pool on the wet floor, with a glint toward the camera
  vec3 lv = uCursor.xyz - vWorld;
  float lh = length(lv.xz);
  float ld2 = dot(lv, lv);
  float lpool = exp(-lh * lh / 7.0) / (1.0 + ld2 * 0.06);
  vec3 lr = reflect(normalize(-lv), vec3(0.0, 1.0, 0.0));
  float lglint = pow(max(dot(lr, -v), 0.0), 18.0) / (1.0 + ld2 * 0.03);
  col += uSignal * uCursor.w * (lpool * 0.5 * (0.45 + 0.55 * wet) + lglint * 0.9 * wet);

  // fog toward the same horizon the sky shows (incl. its red glow ahead): no seam
  float ahead = max(dot(v, normalize(vec3(0.0, 0.05, -1.0))), 0.0);
  vec3 haze = uFogColor + uSignalDeep * (pow(ahead, 14.0) * 0.05 + pow(ahead, 60.0) * 0.1);
  col = mix(col, haze, fogAmount(vDist, uFogDensity));
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Corridor beams: [start, end, core width, intensity]. */
const BEAMS: [THREE.Vector3, THREE.Vector3, number, number][] = [
  [new THREE.Vector3(-7.5, 6.5, 14), new THREE.Vector3(-4, 9.5, -215), 0.35, 1.6],
  [new THREE.Vector3(8, -1.9, 12), new THREE.Vector3(5.5, -2.4, -215), 0.22, 2.2],
  [new THREE.Vector3(5, 12, 4), new THREE.Vector3(-11, 4.5, -215), 0.5, 1.0],
];
const LOW_BEAM = BEAMS[1];

function Ground() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: groundVert,
        fragmentShader: groundFrag,
        uniforms: {
          uSignal: { value: lin(HEX.signal) },
          uSignalDeep: { value: lin(HEX.signalDeep) },
          uFogColor: { value: runtime.fogColor },
          uFogDensity: { value: FOG_DENSITY },
          uTime: { value: 0 },
          uBeam: {
            value: new THREE.Vector4(LOW_BEAM[0].x, LOW_BEAM[0].z, LOW_BEAM[1].x, LOW_BEAM[1].z),
          },
          uPool: { value: new THREE.Vector3(PORTRAIT_POSITION.x, PORTRAIT_POSITION.z - 0.5, 0.5) },
          uCamPool: { value: new THREE.Vector3(0, 0, 0.35) },
          uCursor: { value: new THREE.Vector4(0, 0, 0, 0) },
        },
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }) => {
    const u = mat.uniforms;
    u.uTime.value = clock.elapsedTime;
    camera.getWorldDirection(fwd);
    (u.uCamPool.value as THREE.Vector3).set(camera.position.x + fwd.x * 9, camera.position.z + fwd.z * 9, 0.35);
    const local = runtime.progress / INTRO_END;
    const l = runtime.cursorLight;
    (u.uCursor.value as THREE.Vector4).set(l.x, l.y, l.z, runtime.cursorLightOn);
    (u.uPool.value as THREE.Vector3).z = 0.5 * runtime.arrival * (1 - THREE.MathUtils.smoothstep(local, 0.45, 0.8));
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position={[0, GROUND_Y, -100]}>
      <planeGeometry args={[600, 600]} />
    </mesh>
  );
}

/* --------------------------------------------------------------------------------------- */
/* Beams: long red light lines down the corridor (two crossed quads each, so they read     */
/* from any angle), with packets of light travelling along them.                           */
/* --------------------------------------------------------------------------------------- */

const beamVert = /* glsl */ `
varying vec2 vUv;
varying float vDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const beamFrag = /* glsl */ `
${glslCommon}
uniform vec3 uColor;
uniform float uIntensity;
uniform float uLength;
uniform float uTime;
uniform float uSeed;
uniform float uFogDensity;
varying vec2 vUv;
varying float vDist;
void main() {
  float x = (vUv.x - 0.5) * 2.0;
  float core = exp(-x * x * 60.0);
  float glow = exp(-x * x * 5.0) * 0.18;
  float along = vUv.y * uLength;
  float packet = pow(0.5 + 0.5 * sin((along + uTime * 14.0 + uSeed * 40.0) * 0.07), 10.0);
  float flick = 0.75 + 0.25 * vnoise(vec2(along * 0.08 - uTime * 0.6, uSeed * 13.0));
  float ends = smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  float a = (core + glow) * (0.55 + 1.6 * packet) * flick * ends;
  float fog = 1.0 - fogAmount(vDist, uFogDensity * 0.55);
  gl_FragColor = vec4(uColor * uIntensity * a * fog, 1.0);
}
`;

/** Two crossed unit quads running along +Z from z=0 to z=1 (width 1 across X and Y). */
function crossedQuads() {
  const g = new THREE.BufferGeometry();
  // prettier-ignore
  const pos = new Float32Array([
    -0.5, 0, 0,  0.5, 0, 0,  0.5, 0, 1,  -0.5, 0, 1,
    0, -0.5, 0,  0, 0.5, 0,  0, 0.5, 1,  0, -0.5, 1,
  ]);
  // prettier-ignore
  const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  return g;
}

function Beams() {
  const geo = useMemo(() => crossedQuads(), []);
  const items = useMemo(
    () =>
      BEAMS.map(([a, b, width, intensity], i) => {
        const len = a.distanceTo(b);
        const mat = new THREE.ShaderMaterial({
          vertexShader: beamVert,
          fragmentShader: beamFrag,
          uniforms: {
            uColor: { value: lin(HEX.signal) },
            uIntensity: { value: intensity },
            uLength: { value: len },
            uTime: { value: 0 },
            uSeed: { value: i * 1.7 + 0.3 },
            uFogDensity: { value: FOG_DENSITY },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const obj = new THREE.Object3D();
        obj.position.copy(a);
        obj.lookAt(b);
        // the glow half-width spans ~6× the core
        obj.scale.set(width * 6, width * 6, len);
        obj.updateMatrix();
        return { mat, position: obj.position.clone(), quaternion: obj.quaternion.clone(), scale: obj.scale.clone() };
      }),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      items.forEach((it) => it.mat.dispose());
    },
    [geo, items],
  );
  useFrame(({ clock }) => {
    for (const it of items) it.mat.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <>
      {items.map((it, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={it.mat}
          position={it.position}
          quaternion={it.quaternion}
          scale={it.scale}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

/* --------------------------------------------------------------------------------------- */
/* Shafts: two volumetric cones of red light falling behind the portrait (intro only).      */
/* --------------------------------------------------------------------------------------- */

const shaftVert = /* glsl */ `
uniform float uHeight;
varying vec3 vN;
varying vec3 vV;
varying float vH;
varying vec3 vLocal;
void main() {
  vH = position.y / uHeight + 0.5;
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const shaftFrag = /* glsl */ `
${glslCommon}
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying float vH;
varying vec3 vLocal;
void main() {
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float body = pow(facing, 3.5);
  float along = smoothstep(1.0, 0.82, vH) * (0.3 + 0.7 * vH) * smoothstep(0.0, 0.25, vH);
  float dust = 0.7 + 0.3 * vnoise(vec2(atan(vLocal.z, vLocal.x) * 3.0, vLocal.y * 0.6 - uTime * 0.25));
  gl_FragColor = vec4(uColor * uIntensity * body * along * dust, 1.0);
}
`;

const SHAFTS: [THREE.Vector3, THREE.Vector3, number][] = [
  [new THREE.Vector3(-3.6, 8.5, -4.5), new THREE.Vector3(-1.2, GROUND_Y, -2.2), 2.6],
  [new THREE.Vector3(3.8, 9, -5.5), new THREE.Vector3(1.4, GROUND_Y, -2.6), 2.3],
];

function Shafts() {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      SHAFTS.map(([apex, base, radius]) => {
        const h = apex.distanceTo(base);
        const geo = new THREE.ConeGeometry(radius, h, 40, 1, true);
        const mat = new THREE.ShaderMaterial({
          vertexShader: shaftVert,
          fragmentShader: shaftFrag,
          uniforms: {
            uColor: { value: lin(HEX.signal) },
            uIntensity: { value: 0.22 },
            uTime: { value: 0 },
            uHeight: { value: h },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const dir = apex.clone().sub(base).normalize();
        return {
          geo,
          mat,
          position: apex.clone().add(base).multiplyScalar(0.5),
          quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir),
        };
      }),
    [],
  );
  useEffect(
    () => () =>
      items.forEach((it) => {
        it.geo.dispose();
        it.mat.dispose();
      }),
    [items],
  );
  useFrame(({ clock }) => {
    const local = runtime.progress / INTRO_END;
    const k = runtime.arrival * (1 - THREE.MathUtils.smoothstep(local, 0.4, 0.62));
    if (group.current) group.current.visible = k > 0.002;
    for (const it of items) {
      it.mat.uniforms.uTime.value = clock.elapsedTime;
      it.mat.uniforms.uIntensity.value = 0.1 * k;
    }
  });
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} geometry={it.geo} material={it.mat} position={it.position} quaternion={it.quaternion} />
      ))}
    </group>
  );
}

/* --------------------------------------------------------------------------------------- */
/* Lights (for the chapters' lit materials): dark ambient, a strong red key, a faint cool  */
/* fill, and a red practical that travels just ahead of the camera.                        */
/* --------------------------------------------------------------------------------------- */

function Lights() {
  const practical = useRef<THREE.PointLight>(null);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const l = practical.current;
    if (!l) return;
    camera.getWorldDirection(fwd);
    l.position.copy(camera.position).addScaledVector(fwd, 7);
    l.position.y += 2.2;
  });
  return (
    <>
      <ambientLight color="#3a1c1e" intensity={0.35} />
      <directionalLight color={HEX.signal} intensity={3.2} position={[-6, 5, 3]} />
      <directionalLight color={HEX.cool} intensity={0.35} position={[6, 2, -3]} />
      <hemisphereLight args={['#1a0a0b', '#000000', 0.25]} />
      <pointLight ref={practical} color={HEX.signal} intensity={30} distance={22} decay={2} />
    </>
  );
}

export default function Atmosphere() {
  return (
    <>
      <Sky />
      <Ground />
      <Beams />
      <Shafts />
      <Lights />
    </>
  );
}
