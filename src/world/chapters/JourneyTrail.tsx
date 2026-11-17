import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { journeyStations } from '../../data/journeyData';
import type { JourneyStation } from '../../types/portfolio';
import {
  BONE_TEXT,
  GLOW_PLANE,
  RED_TEXT,
  SIGNAL,
  TEXT_MAT,
  chapterActive,
  hot,
  localToGlobal,
  makeGlowMaterial,
  pathFrame,
  track,
  usePrecompile,
  type TroikaText,
} from './shared';

/* =============================================================================================
   Chapter "journey": a red light-trail running along the RIGHT of the camera path (the
   overlay's station card owns the bottom-left) that draws itself ahead of the camera. The
   milestones are waypoints on it that light up as they are reached; only the next one or two
   carry a label (number + title), fading in ahead and away once passed. The final, future
   station ("NEXT HORIZON") is a pulsing beacon up and to the right that the trail climbs toward.

   Station i is placed so it sits ~6-9 units ahead while the overlay shows its card
   (useSegment('journey', stations.length): card i during local [i/n, (i+1)/n)).
============================================================================================= */

/** How far ahead (journey-local) of its card's midpoint a station sits: ~7.5 world units. */
const STATION_LEAD = 0.244;
const TRAIL_BASE = 1.5; // trail's mean distance to the right of the path
const TRAIL_SWING = 0.7; // it swings out to TRAIL_BASE + SWING at each waypoint
const DROP = 1.25; // trail height below the camera path
/** The beacon sits beyond the chapter end, to the right and raised. */
const BEACON_T = 1.45;
const BEACON_SIDE = 3.0;
const BEACON_UP = 2.4;
/** Label window: a station's label shows while it is between these distances ahead (units). */
const LABEL_FAR = 12.5;
const LABEL_FULL = 10;
const LABEL_NEAR = 5.5;
const LABEL_GONE = 3.5;
/** How far (in overall progress) the trail head runs ahead of the camera. */
const HEAD_LEAD = 0.028;

interface Waypoint {
  station: JourneyStation;
  p: number;
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
}

function build() {
  const total = journeyStations.length;
  const stationLocal = (i: number) => (i + 0.5) / total + STATION_LEAD;
  const regular = journeyStations
    .map((station, i) => ({ station, i }))
    .filter(({ station }) => station.status !== 'FUTURE');
  const future = journeyStations.find((s) => s.status === 'FUTURE') ?? null;
  const pFirst = localToGlobal('journey', stationLocal(regular[0]?.i ?? 0));
  const pLast = localToGlobal('journey', stationLocal(regular[regular.length - 1]?.i ?? 0));
  const dp = localToGlobal('journey', 1 / total) - localToGlobal('journey', 0);

  const trailPoint = (p: number) => {
    const f = pathFrame(p);
    const lateral = TRAIL_BASE + TRAIL_SWING * Math.cos((2 * Math.PI * (p - pFirst)) / dp);
    return f.pos.addScaledVector(f.side, lateral).addScaledVector(f.up, -DROP);
  };

  const waypoints: Waypoint[] = regular.map(({ station, i }) => {
    const p = localToGlobal('journey', stationLocal(i));
    return { station, p, pos: trailPoint(p), tangent: pathFrame(p).tangent };
  });

  // trail samples (with the overall progress at which each should be drawn)
  const samples: THREE.Vector3[] = [];
  const sampleP: number[] = [];
  const pStart = localToGlobal('journey', -0.03);
  const pTrailEnd = pLast + dp * 0.5;
  for (let p = pStart; p <= pTrailEnd; p += 0.0015) {
    samples.push(trailPoint(p));
    sampleP.push(p);
  }

  // climb to the beacon
  const fb = pathFrame(localToGlobal('journey', BEACON_T));
  const beacon = fb.pos.clone().addScaledVector(fb.side, BEACON_SIDE).addScaledVector(fb.up, BEACON_UP);
  const last = samples[samples.length - 1];
  const ft = pathFrame(pTrailEnd).tangent;
  const ctrl = last.clone().addScaledVector(ft, 7).setY(last.y);
  const climb = new THREE.QuadraticBezierCurve3(last.clone(), ctrl, beacon.clone().setY(beacon.y - 0.6));
  const pBeaconDraw = localToGlobal('journey', BEACON_T - 0.05);
  const STEPS = 30;
  for (let i = 1; i <= STEPS; i++) {
    samples.push(climb.getPoint(i / STEPS));
    sampleP.push(THREE.MathUtils.lerp(pTrailEnd, pBeaconDraw, i / STEPS));
  }

  const cum: number[] = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + samples[i].distanceTo(samples[i - 1]));
  const length = cum[cum.length - 1];

  const curve = new THREE.CatmullRomCurve3(samples, false, 'centripetal');
  return { waypoints, future, beacon, curve, sampleP, cumFrac: cum.map((c) => c / length) };
}

/* ------------------------------------------- trail shader ------------------------------------------- */

const trailVert = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const trailFrag = /* glsl */ `
  uniform float uHead;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    float x = vUv.x;
    if (x > uHead) discard;
    float behind = uHead - x;
    float head = exp(-behind * 90.0) * 7.0;
    float flow = pow(0.5 + 0.5 * sin(x * 260.0 - uTime * 7.0), 10.0);
    vec3 c = uColor * (1.5 + flow * 2.6 + head);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/* ------------------------------------------- waypoint ------------------------------------------- */

const _v = new THREE.Vector3();
const _c = new THREE.Color();

interface WaypointGeos {
  ring: THREE.BufferGeometry;
  pillar: THREE.BufferGeometry;
  gem: THREE.BufferGeometry;
}

function WaypointMarker({ wp, geos }: { wp: Waypoint; geos: WaypointGeos }) {
  const gem = useRef<THREE.Mesh>(null);
  const ping = useRef<THREE.Mesh>(null);
  const num = useRef<TroikaText>(null);
  const title = useRef<TroikaText>(null);
  const mats = useMemo(
    () => ({
      ring: new THREE.MeshBasicMaterial({ color: hot(1), toneMapped: false }),
      pillar: new THREE.MeshBasicMaterial({
        color: hot(1),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      gem: new THREE.MeshBasicMaterial({ color: hot(1), wireframe: true, toneMapped: false }),
      ping: new THREE.MeshBasicMaterial({
        color: hot(4),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      glow: makeGlowMaterial(SIGNAL, 0, 2.4),
    }),
    [],
  );
  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveMatsRef = useRef(mats);
  useLayoutEffect(() => {
    const mats = liveMatsRef.current;
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, []);
  const st = useRef({ lit: 0, wasLit: false, litAt: -10 });

  useFrame((state, delta) => {
    const mats = liveMatsRef.current;
    if (!gem.current?.parent?.parent?.visible) return;
    const s = st.current;
    const t = track.time;
    const ahead = _v.subVectors(wp.pos, state.camera.position).dot(wp.tangent);
    const reached = ahead < 3.5;
    const approach = 1 - THREE.MathUtils.smoothstep(ahead, 3.5, 22);
    s.lit = THREE.MathUtils.damp(s.lit, reached ? 1 : 0, 3, Math.min(delta, 0.1));
    if (reached && !s.wasLit) {
      s.wasLit = true;
      s.litAt = t;
    } else if (!reached && ahead > 6) s.wasLit = false;

    const k = 0.25 + approach * 0.45 + s.lit * 4;
    mats.ring.color.copy(_c.set(SIGNAL).multiplyScalar(k * 1.2));
    mats.pillar.color.copy(_c.set(SIGNAL).multiplyScalar(k * 0.6));
    mats.gem.color.copy(_c.set(SIGNAL).multiplyScalar(k * 1.5 + Math.sin(t * 3 + wp.p * 100) * s.lit));
    mats.glow.uniforms.uIntensity.value = 0.15 + s.lit * 0.85;
    gem.current.rotation.y = t * 0.8 + wp.p * 50;
    gem.current.position.y = 1.55 + Math.sin(t * 1.3 + wp.p * 80) * 0.06;

    const since = t - s.litAt;
    if (ping.current) {
      const ph = Math.min(since / 1.2, 1);
      ping.current.scale.setScalar(1 + ph * 3.5);
      mats.ping.opacity = s.wasLit ? (1 - ph) * 0.9 : 0;
    }

    // only the next one or two stations are labelled: fade in ahead, away once (nearly) passed
    const textOn =
      (1 - THREE.MathUtils.smoothstep(ahead, LABEL_FULL, LABEL_FAR)) * THREE.MathUtils.smoothstep(ahead, LABEL_GONE, LABEL_NEAR);
    if (num.current) num.current.fillOpacity = textOn;
    if (title.current) title.current.fillOpacity = textOn;
  });

  return (
    <group position={wp.pos}>
      <mesh geometry={geos.ring} material={mats.ring} rotation-x={-Math.PI / 2} />
      <mesh ref={ping} geometry={geos.ring} material={mats.ping} rotation-x={-Math.PI / 2} />
      <mesh geometry={geos.pillar} material={mats.pillar} position-y={0.75} />
      <mesh ref={gem} geometry={geos.gem} material={mats.gem} position-y={1.55} />
      <Billboard position={[0, 1.55, 0]}>
        <mesh geometry={GLOW_PLANE} material={mats.glow} scale={1.6} />
      </Billboard>
      {/* label to the LEFT of the gem (toward the centre of the frame), never off the right edge */}
      <Billboard position={[0, 1.55, 0]}>
        <Text
          ref={num}
          material={TEXT_MAT}
          position={[-0.32, 0.03, 0]}
          fontSize={0.12}
          letterSpacing={0.22}
          anchorX="right"
          anchorY="bottom"
          color={RED_TEXT}
          fillOpacity={0}
        >
          {wp.station.numberStr}
        </Text>
        <Text
          ref={title}
          material={TEXT_MAT}
          position={[-0.32, 0, 0]}
          fontSize={0.2}
          fontWeight={800}
          letterSpacing={0.03}
          anchorX="right"
          anchorY="top"
          color={BONE_TEXT}
          fillOpacity={0}
        >
          {wp.station.title}
        </Text>
      </Billboard>
    </group>
  );
}

/* ------------------------------------------- beacon ------------------------------------------- */

const beamVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const beamFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float fade = pow(1.0 - vUv.y, 1.6);
    gl_FragColor = vec4(uColor * fade * uIntensity, 1.0);
  }
`;

function Beacon({ station, pos }: { station: JourneyStation; pos: THREE.Vector3 }) {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const pings = useRef<(THREE.Mesh | null)[]>([]);
  const num = useRef<TroikaText>(null);
  const title = useRef<TroikaText>(null);
  const res = useMemo(
    () => ({
      beamGeo: new THREE.CylinderGeometry(0.06, 0.06, 60, 12, 1, true),
      beamMat: new THREE.ShaderMaterial({
        uniforms: { uColor: { value: hot(1) }, uIntensity: { value: 3 } },
        vertexShader: beamVert,
        fragmentShader: beamFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      coreGeo: new THREE.OctahedronGeometry(0.42, 0),
      shellGeo: new THREE.IcosahedronGeometry(0.95, 1),
      ringGeo: new THREE.TorusGeometry(1, 0.012, 4, 96),
      coreMat: new THREE.MeshBasicMaterial({ color: hot(6), toneMapped: false }),
      shellMat: new THREE.MeshBasicMaterial({ color: hot(1.6), wireframe: true, toneMapped: false }),
      pingMats: [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: hot(3),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
      glow: makeGlowMaterial(SIGNAL, 1, 2),
    }),
    [],
  );
  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveResRef = useRef(res);
  useLayoutEffect(() => {
    const res = liveResRef.current;
    return () => {
      res.beamGeo.dispose();
      res.beamMat.dispose();
      res.coreGeo.dispose();
      res.shellGeo.dispose();
      res.ringGeo.dispose();
      res.coreMat.dispose();
      res.shellMat.dispose();
      res.pingMats.forEach((m) => m.dispose());
      res.glow.dispose();
    };
  }, []);

  useFrame((state) => {
    const res = liveResRef.current;
    if (!core.current?.parent?.parent?.visible) return;
    const t = track.time;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    res.coreMat.color.copy(_c.set(SIGNAL).multiplyScalar(4 + pulse * 6));
    res.glow.uniforms.uIntensity.value = 0.6 + pulse * 0.7;
    res.beamMat.uniforms.uIntensity.value = 1.6 + pulse * 1.6;
    if (core.current) {
      core.current.rotation.y = t * 0.9;
      core.current.scale.setScalar(1 + pulse * 0.15);
    }
    if (shell.current) {
      shell.current.rotation.y = -t * 0.25;
      shell.current.rotation.x = t * 0.15;
    }
    pings.current.forEach((m, i) => {
      if (!m) return;
      const ph = (t * 0.35 + i / 3) % 1;
      m.scale.setScalar(0.6 + ph * 4.5);
      res.pingMats[i].opacity = (1 - ph) * 0.9;
    });
    // labelled only once its card is up (the last stretch of the chapter), gone up close
    const card = THREE.MathUtils.smoothstep(track.p, localToGlobal('journey', 0.84), localToGlobal('journey', 0.92));
    const dist = state.camera.position.distanceTo(pos);
    const textOn = card * THREE.MathUtils.smoothstep(dist, 7, 11);
    if (title.current) title.current.fillOpacity = textOn * (0.85 + pulse * 0.15);
    if (num.current) num.current.fillOpacity = textOn;
  });

  return (
    <group position={pos}>
      <mesh geometry={res.beamGeo} material={res.beamMat} position-y={30} />
      <mesh ref={core} geometry={res.coreGeo} material={res.coreMat} />
      <mesh ref={shell} geometry={res.shellGeo} material={res.shellMat} />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            pings.current[i] = el;
          }}
          geometry={res.ringGeo}
          material={res.pingMats[i]}
          rotation-x={-Math.PI / 2}
        />
      ))}
      <Billboard>
        <mesh geometry={GLOW_PLANE} material={res.glow} scale={6} />
        <Text
          ref={num}
          material={TEXT_MAT}
          position={[0, 1.95, 0]}
          fontSize={0.16}
          letterSpacing={0.26}
          anchorX="center"
          anchorY="bottom"
          color={RED_TEXT}
          fillOpacity={0}
        >
          {station.numberStr}
        </Text>
        <Text
          ref={title}
          material={TEXT_MAT}
          position={[0, 1.4, 0]}
          fontSize={0.4}
          fontWeight={900}
          letterSpacing={0.03}
          anchorX="center"
          anchorY="bottom"
          color={BONE_TEXT}
          fillOpacity={0}
        >
          {station.title}
        </Text>
      </Billboard>
    </group>
  );
}

/* ------------------------------------------- chapter root ------------------------------------------- */

export function JourneyTrail() {
  const warmRef = useRef({ frames: 0 });
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const data = useMemo(() => build(), []);
  const res = useMemo(() => {
    const tube = new THREE.TubeGeometry(data.curve, 900, 0.035, 6, false);
    return {
      tube,
      trailMat: new THREE.ShaderMaterial({
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uHead: { value: 0 },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(SIGNAL) },
        },
        vertexShader: trailVert,
        fragmentShader: trailFrag,
        fog: true,
        toneMapped: false,
      }),
      ghostMat: new THREE.MeshBasicMaterial({
        color: hot(0.5),
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      wp: {
        ring: new THREE.TorusGeometry(0.36, 0.014, 4, 64),
        pillar: new THREE.CylinderGeometry(0.008, 0.008, 1.5, 4, 1, true),
        gem: new THREE.OctahedronGeometry(0.17, 0),
      },
      headGeo: new THREE.SphereGeometry(0.07, 12, 8),
      headMat: new THREE.MeshBasicMaterial({ color: hot(10), toneMapped: false }),
      headGlow: makeGlowMaterial(SIGNAL, 1.2, 2.2),
    };
  }, [data]);

  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveResRef = useRef(res);
  useLayoutEffect(() => {
    const res = liveResRef.current;
    return () => {
      res.tube.dispose();
      res.trailMat.dispose();
      res.ghostMat.dispose();
      Object.values(res.wp).forEach((g) => g.dispose());
      res.headGeo.dispose();
      res.headMat.dispose();
      res.headGlow.dispose();
    };
  }, []);

  usePrecompile(root);

  useFrame(() => {
    const res = liveResRef.current;
    const g = root.current;
    if (!g) return;
    const active = chapterActive('journey', track.p, 0.07, 0.1, warmRef.current);
    g.visible = active;
    if (!active) return;

    // map the camera's progress (plus a lead) to a fraction of the trail's length
    const target = track.p + HEAD_LEAD;
    const { sampleP, cumFrac } = data;
    let frac = 0;
    if (target >= sampleP[sampleP.length - 1]) frac = 1;
    else if (target > sampleP[0]) {
      let lo = 0;
      let hi = sampleP.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (sampleP[mid] <= target) lo = mid;
        else hi = mid;
      }
      const k = (target - sampleP[lo]) / (sampleP[hi] - sampleP[lo]);
      frac = THREE.MathUtils.lerp(cumFrac[lo], cumFrac[hi], k);
    }
    res.trailMat.uniforms.uHead.value = frac;
    res.trailMat.uniforms.uTime.value = track.time;
    if (head.current) {
      head.current.visible = frac > 0.001 && frac < 0.999;
      data.curve.getPointAt(Math.min(frac, 1), head.current.position);
    }
  });

  return (
    <group ref={root}>
      <mesh geometry={res.tube} material={res.ghostMat} frustumCulled={false} />
      <mesh geometry={res.tube} material={res.trailMat} frustumCulled={false} />
      <group ref={head}>
        <mesh geometry={res.headGeo} material={res.headMat} />
        <Billboard>
          <mesh geometry={GLOW_PLANE} material={res.headGlow} scale={1.4} />
        </Billboard>
      </group>
      {data.waypoints.map((wp) => (
        <WaypointMarker key={wp.station.id} wp={wp} geos={res.wp} />
      ))}
      {data.future && <Beacon station={data.future} pos={data.beacon} />}
    </group>
  );
}
