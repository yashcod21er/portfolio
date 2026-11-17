import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { skillsData } from '../../data/skillsData';
import { CHAPTER_RANGES, pathPoint } from '../layout';
import { runtime } from '../runtime';
import {
  BONE_TEXT,
  RED_TEXT,
  SIGNAL,
  TEXT_MAT,
  UP,
  chapterActive,
  hot,
  localToGlobal,
  smooth,
  track,
  usePrecompile,
  type TroikaText,
} from './shared';

/* =============================================================================================
   Chapter "stack": a star chart of the skills. Each domain is a constellation: a hub star with
   its skills chained below it, the hubs joined in a ring, and shared skills bridged across
   domains. The chart hangs in the left/centre of the frame (the overlay's domain list owns the
   right) and travels with the camera through the chapter, slowly closing in and turning; the
   domain the overlay highlights glows hottest. After the chapter the camera flies through it.
============================================================================================= */

/** Chart layout (units ≈ world units at the docking distance). Hub of each domain, in order. */
const HUBS: [number, number][] = [
  [-0.6, 2.25], // frontend
  [2.2, 1.25], // backend
  [1.45, -0.95], // database
  [-1.45, -1.05], // programming
  [-3.65, 1.15], // tools
];
const ROW = 0.42; // vertical spacing of skills under a hub
/** Docking distance ahead of the camera at the chapter's start / end. */
const D_START = 15;
const D_END = 12;
/** Chart centre in the camera's frame, as a fraction of the distance (left of centre, a touch high). */
const OFF_X = -0.15;
const OFF_Y = 0.045;

interface Node {
  name: string;
  domain: number;
  /** chart-space position */
  pos: THREE.Vector3;
}

interface Edge {
  a: THREE.Vector3;
  b: THREE.Vector3;
  domain: number;
  /** chain: within a domain · ring: hub to hub · bridge: hub to a skill shared with another domain */
  kind: 'chain' | 'ring' | 'bridge';
}

function build() {
  const hash = (n: number) => {
    const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const hubs = skillsData.map((d, i) => {
    const [x, y] = HUBS[i % HUBS.length];
    return { name: d.id.toUpperCase(), tag: d.tag, pos: new THREE.Vector3(x, y, (hash(i) - 0.5) * 0.8) };
  });
  const nodes: Node[] = [];
  const byName = new Map<string, Node>();
  const edges: Edge[] = [];
  skillsData.forEach((dom, d) => {
    const hub = hubs[d].pos;
    let prev = hub;
    let row = 0;
    dom.skills.forEach((sk) => {
      const existing = byName.get(sk.name);
      if (existing) {
        // shared skill: bridge from this hub to where it already lives
        edges.push({ a: hub, b: existing.pos, domain: d, kind: 'bridge' });
        return;
      }
      row++;
      const k = nodes.length;
      const pos = new THREE.Vector3(
        hub.x + 0.12 + (row % 2 === 0 ? 0.22 : 0) + (hash(k + 7) - 0.5) * 0.08,
        hub.y - row * ROW,
        hub.z + (hash(k + 31) - 0.5) * 1.1,
      );
      const n: Node = { name: sk.name, domain: d, pos };
      nodes.push(n);
      byName.set(sk.name, n);
      edges.push({ a: prev, b: pos, domain: d, kind: 'chain' });
      prev = pos;
    });
  });
  hubs.forEach((h, i) => {
    const next = hubs[(i + 1) % hubs.length];
    edges.push({ a: h.pos, b: next.pos, domain: i, kind: 'ring' });
  });
  return { hubs, nodes, edges };
}

const _cam = new THREE.Vector3();
const _gaze = new THREE.Vector3();
const _side = new THREE.Vector3();
const _up = new THREE.Vector3();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _e = new THREE.Euler();
const ORIGIN = new THREE.Vector3();

export function StackConstellation() {
  const warmRef = useRef({ frames: 0 });
  const root = useRef<THREE.Group>(null);
  const chart = useRef<THREE.Group>(null);
  const nodesMesh = useRef<THREE.InstancedMesh>(null);
  const hubsMesh = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const skillTexts = useRef<(TroikaText | null)[]>([]);
  const domainTexts = useRef<(TroikaText | null)[]>([]);
  const st = useRef({ reveal: 0, focus: [0, 0, 0, 0, 0] });

  const { hubs, nodes, edges } = useMemo(() => build(), []);

  const res = useMemo(() => {
    const lineGeo = new THREE.BufferGeometry();
    const lp = new Float32Array(edges.length * 6);
    edges.forEach((e, i) => {
      lp.set([e.a.x, e.a.y, e.a.z, e.b.x, e.b.y, e.b.z], i * 6);
    });
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges.length * 3), 3));
    return {
      lineGeo,
      pulseGeo,
      nodeGeo: new THREE.IcosahedronGeometry(1, 2),
      hubGeo: new THREE.OctahedronGeometry(1, 0),
      haloGeo: new THREE.PlaneGeometry(1, 1),
      nodeMat: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false }),
      hubMat: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false, wireframe: true }),
      haloMat: new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            // billboard each instance toward the camera
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            float s = length(instanceMatrix[0].xyz);
            mv.xy += position.xy * s;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float d = length(vUv * 2.0 - 1.0);
            float g = pow(max(1.0 - d, 0.0), 2.4);
            gl_FragColor = vec4(uColor * g * uOpacity, 1.0);
          }
        `,
        uniforms: { uColor: { value: hot(1.6) }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      lineMat: new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
      pulseMat: new THREE.PointsMaterial({
        color: hot(5),
        size: 0.13,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    };
  }, [edges]);

  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveRef = useRef({ res });

  useLayoutEffect(() => {
    const live = liveRef.current;
    return () => Object.values(live.res).forEach((r) => r.dispose());
  }, []);

  usePrecompile(root);

  useFrame((state, delta) => {
    const { res } = liveRef.current;
    const g = root.current;
    if (!g) return;
    const active = chapterActive('stack', track.p, 0.08, 0.05, warmRef.current);
    g.visible = active;
    if (!active) return;
    const t = track.time;
    const dt = Math.min(delta, 0.1);
    const s = st.current;

    // --- placement: docked in the camera's frame during the chapter, frozen before / after ---
    const [a, b] = CHAPTER_RANGES.stack;
    const raw = (runtime.camU - a) / (b - a);
    const lc = THREE.MathUtils.clamp(raw, 0, 1);
    const uCam = localToGlobal('stack', lc);
    pathPoint(uCam, _cam);
    pathPoint(Math.min(uCam + 0.015, 1), _gaze).sub(_cam).normalize();
    _side.crossVectors(_gaze, UP).normalize();
    _up.crossVectors(_side, _gaze).normalize();
    const D = THREE.MathUtils.lerp(D_START, D_END, smooth(lc, 0, 1));
    g.position
      .copy(_cam)
      .addScaledVector(_gaze, D)
      .addScaledVector(_side, OFF_X * D)
      .addScaledVector(_up, OFF_Y * D);
    _m.lookAt(_v.copy(_gaze).negate(), ORIGIN, _up);
    g.quaternion.setFromRotationMatrix(_m);
    // a slow, scroll-driven turn so the depth of the chart reads, plus a little drift
    _e.set(Math.sin(t * 0.21) * 0.04, (lc - 0.5) * 0.5 + Math.sin(t * 0.13) * 0.06, Math.sin(t * 0.17) * 0.02);
    g.quaternion.multiply(_q2.setFromEuler(_e));

    // --- visibility: fades in from the distance, out as the camera flies through it ---
    const dist = state.camera.position.distanceTo(g.position);
    const reveal = (1 - smooth(dist, 26, 40)) * smooth(dist, 3.5, 7.5);
    s.reveal = THREE.MathUtils.damp(s.reveal, reveal, 4, dt);
    const textReveal = (1 - smooth(dist, 19, 28)) * smooth(dist, 6, 9);

    // the domain the overlay is highlighting
    const focusD = Math.min(skillsData.length - 1, Math.floor(lc * skillsData.length));
    for (let d = 0; d < s.focus.length; d++) {
      s.focus[d] = THREE.MathUtils.damp(s.focus[d], raw >= 0 && raw <= 1.02 && d === focusD ? 1 : 0, 4, dt);
    }

    // --- nodes + halos ---
    const nm = nodesMesh.current;
    const hm = halos.current;
    nodes.forEach((n, i) => {
      const f = s.focus[n.domain];
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.73);
      const size = (0.075 + f * 0.035) * (0.9 + pulse * 0.2) * s.reveal;
      if (nm) {
        nm.setMatrixAt(i, _m.compose(n.pos, _q.identity(), _s.setScalar(size)));
        nm.setColorAt(i, _c.set(SIGNAL).multiplyScalar(3 + pulse * 2.5 + f * 5));
      }
      if (hm) hm.setMatrixAt(i, _m.compose(n.pos, _q.identity(), _s.setScalar(size * (8 + f * 4))));
      const tx = skillTexts.current[i];
      if (tx) tx.fillOpacity = textReveal * (0.72 + 0.28 * f);
    });
    if (nm) {
      nm.instanceMatrix.needsUpdate = true;
      if (nm.instanceColor) nm.instanceColor.needsUpdate = true;
    }
    if (hm) hm.instanceMatrix.needsUpdate = true;
    res.haloMat.uniforms.uOpacity.value = s.reveal * 0.6;

    // --- hubs ---
    const hb = hubsMesh.current;
    if (hb) {
      hubs.forEach((h, i) => {
        const f = s.focus[i];
        _q.setFromAxisAngle(UP, t * 0.6 + i);
        hb.setMatrixAt(i, _m.compose(h.pos, _q, _s.setScalar((0.13 + f * 0.06) * s.reveal)));
        hb.setColorAt(i, _c.set(SIGNAL).multiplyScalar(2.5 + f * 5));
        const tx = domainTexts.current[i];
        if (tx) tx.fillOpacity = textReveal * (0.75 + 0.25 * f);
      });
      hb.instanceMatrix.needsUpdate = true;
      if (hb.instanceColor) hb.instanceColor.needsUpdate = true;
    }

    // --- wires (focused domain hottest) + travelling pulses ---
    const lc3 = res.lineGeo.attributes.color as THREE.BufferAttribute;
    const pp = res.pulseGeo.attributes.position as THREE.BufferAttribute;
    edges.forEach((e, i) => {
      const f = e.kind === 'ring' ? 0 : s.focus[e.domain];
      const k = e.kind === 'ring' ? 0.55 : e.kind === 'bridge' ? 0.7 + f * 1.6 : 0.9 + f * 2.2;
      _c.set(SIGNAL).multiplyScalar(k);
      lc3.setXYZ(i * 2, _c.r, _c.g, _c.b);
      lc3.setXYZ(i * 2 + 1, _c.r, _c.g, _c.b);
      const ph = (t * (e.kind === 'ring' ? 0.12 : 0.45) + i * 0.618) % 1;
      _v.lerpVectors(e.a, e.b, ph);
      pp.setXYZ(i, _v.x, _v.y, _v.z);
    });
    lc3.needsUpdate = true;
    pp.needsUpdate = true;
    res.lineMat.opacity = s.reveal * 0.75;
    res.pulseMat.opacity = s.reveal;
  });

  return (
    <group ref={root}>
      <group ref={chart}>
        <instancedMesh ref={halos} args={[res.haloGeo, res.haloMat, nodes.length]} frustumCulled={false} />
        <instancedMesh ref={nodesMesh} args={[res.nodeGeo, res.nodeMat, nodes.length]} frustumCulled={false} />
        <instancedMesh ref={hubsMesh} args={[res.hubGeo, res.hubMat, hubs.length]} frustumCulled={false} />
        <lineSegments geometry={res.lineGeo} material={res.lineMat} frustumCulled={false} />
        <points geometry={res.pulseGeo} material={res.pulseMat} frustumCulled={false} />

        {nodes.map((n, i) => (
          <Billboard key={n.name} position={[n.pos.x + 0.17, n.pos.y, n.pos.z]}>
            <Text
              ref={(el: TroikaText | null) => {
                skillTexts.current[i] = el;
              }}
              material={TEXT_MAT}
              fontSize={0.25}
              fontWeight={600}
              letterSpacing={0.02}
              anchorX="left"
              anchorY="middle"
              color={BONE_TEXT}
              outlineWidth={0.014}
              outlineColor="#070506"
              outlineOpacity={0.6}
              fillOpacity={0}
            >
              {n.name}
            </Text>
          </Billboard>
        ))}

        {hubs.map((h, i) => (
          <Billboard key={h.name} position={[h.pos.x - 0.1, h.pos.y + 0.24, h.pos.z]}>
            <Text
              ref={(el: TroikaText | null) => {
                domainTexts.current[i] = el;
              }}
              material={TEXT_MAT}
              fontSize={0.21}
              fontWeight={800}
              letterSpacing={0.12}
              anchorX="left"
              anchorY="bottom"
              color={RED_TEXT}
              fillOpacity={0}
            >
              {`D/${String(i + 1).padStart(2, '0')}  ${h.name}`}
            </Text>
          </Billboard>
        ))}
      </group>
    </group>
  );
}
