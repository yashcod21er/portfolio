import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { chapterLocal } from '../layout';
import {
  GLOW_PLANE,
  SIGNAL,
  chapterActive,
  facingQuat,
  hot,
  localToGlobal,
  makeGlowMaterial,
  pathFrame,
  smooth,
  track,
  usePrecompile,
} from './shared';

/* =============================================================================================
   Chapter "contact": a giant red gate at the end of the flight. A glowing torus frame with
   rotating tick rings and arcs, a swirling vortex inside, and particles spiralling into it.
   Everything intensifies as the camera closes in. It stands to the RIGHT of the path so it
   frames the overlay's headline (left / centre) instead of sitting under it, and its centre is
   kept moderate so the white headline stays readable. No 3D text: the overlay says it.
============================================================================================= */

const RADIUS = 3.4;
/** Distance past the end of the camera path. */
const AHEAD = 12;
/** Offset to the right of / above the path: centre lands at ~70% of the frame width. */
const SIDE = 3.4;
const LIFT = 0.55;
const PARTICLES = 500;
const TICKS = 96;
const ARCS = 4;

const vortexVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const vortexFrag = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);
    float spd = 0.3 + uIntensity * 0.9;
    // twist tightens toward the centre
    float tw = a + 2.2 / (r + 0.18) - uTime * spd;
    vec2 q = vec2(cos(tw), sin(tw)) * 1.5 + vec2(r * 3.0 - uTime * 0.5 * spd, 0.0);
    float n = fbm(q * 1.6 + r * 2.0);
    float arms = pow(0.5 + 0.5 * sin(tw * 4.0 + n * 3.0), 3.0);
    float v = arms * 0.65 + n * 0.55;
    float rim = smoothstep(1.0, 0.8, r);
    float edge = exp(-pow((r - 0.97) * 14.0, 2.0));
    float eye = smoothstep(0.04, 0.42, r);
    float core = exp(-r * r * 90.0);
    float I = uIntensity;
    float g = v * v * rim * eye * (0.4 + I * 1.1) + edge * (0.35 + I) + core * (0.45 + I * 0.9);
    vec3 col = uColor * g * 1.6 + vec3(1.0, 0.75, 0.65) * pow(max(g - 1.4, 0.0), 2.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const particleVert = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uRadius;
  uniform float uPixelRatio;
  attribute vec4 aSeed;
  varying float vAlpha;
  void main() {
    float spd = aSeed.z * (0.3 + uIntensity * 0.9);
    float life = fract(aSeed.w + uTime * spd);
    float r = uRadius * mix(1.9, 0.05, pow(life, 1.4));
    float ang = aSeed.x + life * 5.0 + uTime * 0.2;
    float z = mix(aSeed.y, -0.4, pow(life, 0.8));
    vec4 mv = modelViewMatrix * vec4(cos(ang) * r, sin(ang) * r, z, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.85, 1.0, life));
    gl_PointSize = min((2.0 + aSeed.z * 6.0) * uPixelRatio * (16.0 / max(-mv.z, 0.1)), 40.0);
  }
`;
const particleFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * (2.0 + uIntensity * 3.0) * a * vAlpha * uOpacity, 1.0);
  }
`;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);

export function ContactPortal() {
  const warmRef = useRef({ frames: 0 });
  const root = useRef<THREE.Group>(null);
  const ticksRef = useRef<THREE.InstancedMesh>(null);
  const tickGroup = useRef<THREE.Group>(null);
  const arcGroup = useRef<THREE.Group>(null);
  const st = useRef({ intensity: 0, reveal: 0 });
  const gl = useThree((s) => s.gl);

  const frame = useMemo(() => {
    const f = pathFrame(1);
    return {
      pos: f.pos.addScaledVector(f.tangent, AHEAD).addScaledVector(f.side, SIDE).addScaledVector(f.up, LIFT),
      quat: facingQuat(f.tangent),
    };
  }, []);

  const res = useMemo(() => {
    const seeds = new Float32Array(PARTICLES * 4);
    const rand = (() => {
      let s = 9001;
      return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
    })();
    for (let i = 0; i < PARTICLES; i++) {
      seeds[i * 4] = rand() * Math.PI * 2;
      seeds[i * 4 + 1] = 0.5 + rand() * 5;
      seeds[i * 4 + 2] = 0.08 + rand() * 0.35;
      seeds[i * 4 + 3] = rand();
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3));
    particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    return {
      particleGeo,
      particleMat: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uOpacity: { value: 0 },
          uRadius: { value: RADIUS },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color(SIGNAL) },
        },
        vertexShader: particleVert,
        fragmentShader: particleFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      vortexGeo: new THREE.CircleGeometry(RADIUS - 0.04, 128),
      vortexMat: new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uColor: { value: new THREE.Color(SIGNAL) } },
        vertexShader: vortexVert,
        fragmentShader: vortexFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      mainGeo: new THREE.TorusGeometry(RADIUS, 0.075, 16, 220),
      innerGeo: new THREE.TorusGeometry(RADIUS - 0.24, 0.012, 6, 200),
      outerGeo: new THREE.TorusGeometry(RADIUS + 0.62, 0.01, 6, 200),
      arcGeo: new THREE.TorusGeometry(RADIUS + 1.0, 0.035, 4, 60, Math.PI * 0.4),
      tickGeo: new THREE.BoxGeometry(0.025, 0.2, 0.02),
      mainMat: new THREE.MeshBasicMaterial({ color: hot(6), toneMapped: false }),
      thinMat: new THREE.MeshBasicMaterial({ color: hot(2.5), toneMapped: false }),
      tickMat: new THREE.MeshBasicMaterial({ color: hot(2), toneMapped: false }),
      arcMat: new THREE.MeshBasicMaterial({ color: hot(3), toneMapped: false }),
      glow: makeGlowMaterial(SIGNAL, 0, 2.6),
    };
  }, []);

  useLayoutEffect(() => {
    const m = ticksRef.current;
    if (!m) return;
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2;
      const long = i % 8 === 0;
      _p.set(Math.cos(a) * (RADIUS + 0.32), Math.sin(a) * (RADIUS + 0.32), 0);
      _q.setFromAxisAngle(Z, a - Math.PI / 2);
      _s.set(1, long ? 2.2 : 1, 1);
      m.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveResRef = useRef(res);
  useLayoutEffect(() => {
    const res = liveResRef.current;
    return () => {
      Object.values(res).forEach((r) => r.dispose());
    };
  }, []);

  usePrecompile(root);

  useFrame((_, delta) => {
    const res = liveResRef.current;
    const g = root.current;
    if (!g) return;
    const active = chapterActive('contact', track.p, 0.1, 0.1, warmRef.current);
    g.visible = active;
    if (!active) return;
    const dt = Math.min(delta, 0.1);
    const t = track.time;
    const s = st.current;
    const local = chapterLocal('contact', track.p);
    const reveal = smooth(track.p, localToGlobal('contact', -0.5), localToGlobal('contact', 0.15));
    s.reveal = THREE.MathUtils.damp(s.reveal, reveal, 3, dt);
    s.intensity = THREE.MathUtils.damp(s.intensity, 0.25 + local * 1.35, 2.5, dt);
    const I = s.intensity * s.reveal;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);

    res.vortexMat.uniforms.uTime.value = t;
    res.vortexMat.uniforms.uIntensity.value = I;
    res.particleMat.uniforms.uTime.value = t;
    res.particleMat.uniforms.uIntensity.value = I;
    res.particleMat.uniforms.uOpacity.value = s.reveal;
    res.particleMat.uniforms.uPixelRatio.value = gl.getPixelRatio();
    res.mainMat.color.set(SIGNAL).multiplyScalar((2 + I * 4 + pulse * 1.2) * s.reveal);
    res.thinMat.color.set(SIGNAL).multiplyScalar((1 + I * 1.8) * s.reveal);
    res.tickMat.color.set(SIGNAL).multiplyScalar((0.8 + I * 2) * s.reveal);
    res.arcMat.color.set(SIGNAL).multiplyScalar((1.2 + I * 2.5) * s.reveal);
    res.glow.uniforms.uIntensity.value = (0.22 + I * 0.22) * s.reveal;

    if (tickGroup.current) tickGroup.current.rotation.z = t * (0.04 + I * 0.08);
    if (arcGroup.current) arcGroup.current.rotation.z = -t * (0.1 + I * 0.25);
    g.scale.setScalar(0.85 + 0.15 * s.reveal);

  });

  return (
    <group ref={root} position={frame.pos} quaternion={frame.quat}>
      {/* local +Z faces the arriving camera */}
      <mesh geometry={GLOW_PLANE} material={res.glow} position-z={-0.6} scale={RADIUS * 5.5} />
      <mesh geometry={res.vortexGeo} material={res.vortexMat} />
      <mesh geometry={res.mainGeo} material={res.mainMat} />
      <mesh geometry={res.innerGeo} material={res.thinMat} />
      <mesh geometry={res.outerGeo} material={res.thinMat} />
      <group ref={tickGroup}>
        <instancedMesh ref={ticksRef} args={[res.tickGeo, res.tickMat, TICKS]} frustumCulled={false} />
      </group>
      <group ref={arcGroup}>
        {Array.from({ length: ARCS }, (_, i) => (
          <mesh key={i} geometry={res.arcGeo} material={res.arcMat} rotation-z={(i / ARCS) * Math.PI * 2} />
        ))}
      </group>
      <points geometry={res.particleGeo} material={res.particleMat} frustumCulled={false} />

    </group>
  );
}
