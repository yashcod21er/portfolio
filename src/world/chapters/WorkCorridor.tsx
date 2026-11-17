import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SIGNAL, facingQuat, localToGlobal, pathFrame, rng, track } from './shared';
import { workLive } from './workLive';

/** Red light a lit screen throws on a point: soft falloff over a few units. */
function spillAt(p: THREE.Vector3) {
  let k = 0;
  for (let i = 0; i < workLive.pos.length; i++) {
    const l = workLive.light[i];
    if (l <= 0.01) continue;
    const d2 = p.distanceToSquared(workLive.pos[i]);
    k += l * Math.exp(-d2 / 26);
  }
  return k;
}

/* =============================================================================================
   Architecture for the work corridor: paired gate rings the camera flies through, rotating
   segment arcs, runway rails with chasing lights, and drifting red wireframe debris.
============================================================================================= */

const RING_PAIRS_T = [0.025, 0.27, 0.5, 0.735, 0.975];
const RING_RADIUS = 6.0;
const ARCS_PER_GATE = 3;
const DEBRIS = 26;
const RAIL_SIDE = 4.4;
const RAIL_DOWN = 1.9;
const LIGHT_SPACING = 2.2;

class RailCurve extends THREE.Curve<THREE.Vector3> {
  p0: number;
  p1: number;
  lateral: number;
  constructor(p0: number, p1: number, lateral: number) {
    super();
    this.p0 = p0;
    this.p1 = p1;
    this.lateral = lateral;
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const f = pathFrame(THREE.MathUtils.lerp(this.p0, this.p1, t));
    return target.copy(f.pos).addScaledVector(f.side, this.lateral).addScaledVector(f.up, -RAIL_DOWN);
  }
}

interface Gate {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  tangent: THREE.Vector3;
}

interface Debris {
  pos: THREE.Vector3;
  axis: THREE.Vector3;
  speed: number;
  scale: number;
  phase: number;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Color();
const Z = new THREE.Vector3(0, 0, 1);

export function WorkCorridor() {
  const rings = useRef<THREE.InstancedMesh>(null);
  const arcs = useRef<THREE.InstancedMesh>(null);
  const debris = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    const rand = rng(1709);
    const gates: Gate[] = [];
    for (const t of RING_PAIRS_T) {
      for (const off of [-0.012, 0.012]) {
        const f = pathFrame(localToGlobal('work', t + off));
        gates.push({ pos: f.pos, quat: facingQuat(f.tangent), tangent: f.tangent });
      }
    }
    const bits: Debris[] = [];
    for (let i = 0; i < DEBRIS; i++) {
      const f = pathFrame(localToGlobal('work', -0.02 + rand() * 1.04));
      const side = rand() < 0.5 ? -1 : 1;
      const pos = f.pos
        .clone()
        .addScaledVector(f.side, side * (6 + rand() * 6))
        .addScaledVector(f.up, -2.5 + rand() * 7);
      bits.push({
        pos,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        speed: 0.08 + rand() * 0.25,
        scale: 0.25 + rand() * 1.1,
        phase: rand() * Math.PI * 2,
      });
    }
    const p0 = localToGlobal('work', -0.03);
    const p1 = localToGlobal('work', 1.02);
    const railL = new RailCurve(p0, p1, -RAIL_SIDE);
    const railR = new RailCurve(p0, p1, RAIL_SIDE);
    const railLen = railL.getLength();
    const lightCount = Math.floor(railLen / LIGHT_SPACING);
    // runway lights: positions along both rails, plus their chapter-local "u" for the chase
    const lightPos: THREE.Vector3[] = [];
    const lightU: number[] = [];
    const lightQ: THREE.Quaternion[] = [];
    for (let i = 0; i < lightCount; i++) {
      const u = (i + 0.5) / lightCount;
      for (const rail of [railL, railR]) {
        lightPos.push(rail.getPointAt(u));
        lightQ.push(facingQuat(rail.getTangentAt(u)));
        lightU.push(u);
      }
    }
    return {
      gates,
      bits,
      lightPos,
      lightU,
      lightQ,
      railGeoL: new THREE.TubeGeometry(railL, 260, 0.014, 4, false),
      railGeoR: new THREE.TubeGeometry(railR, 260, 0.014, 4, false),
    };
  }, []);

  const geos = useMemo(
    () => ({
      ring: new THREE.TorusGeometry(RING_RADIUS, 0.016, 6, 160),
      arc: new THREE.TorusGeometry(RING_RADIUS + 0.45, 0.05, 4, 40, Math.PI * 0.32),
      debris: new THREE.IcosahedronGeometry(1, 0),
      light: new THREE.BoxGeometry(0.06, 0.03, 0.5),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      ring: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      arc: new THREE.MeshBasicMaterial({ color: new THREE.Color(SIGNAL).multiplyScalar(2.2), toneMapped: false }),
      debris: new THREE.MeshBasicMaterial({
        color: new THREE.Color(SIGNAL).multiplyScalar(1.4),
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
      }),
      light: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      rail: new THREE.MeshBasicMaterial({ color: new THREE.Color(SIGNAL).multiplyScalar(1.6), toneMapped: false }),
    }),
    [],
  );

  // static instance matrices
  useLayoutEffect(() => {
    const r = rings.current;
    if (r) {
      data.gates.forEach((g, i) => {
        _q.copy(g.quat).multiply(_q2.setFromAxisAngle(Z, i * 0.7));
        _s.setScalar(i % 2 === 0 ? 1 : 0.94);
        r.setMatrixAt(i, _m.compose(g.pos, _q, _s));
        r.setColorAt(i, _c.set(SIGNAL));
      });
      r.instanceMatrix.needsUpdate = true;
      if (r.instanceColor) r.instanceColor.needsUpdate = true;
    }
    const l = lights.current;
    if (l) {
      data.lightPos.forEach((p, i) => {
        l.setMatrixAt(i, _m.compose(p, data.lightQ[i], _s.setScalar(1)));
        l.setColorAt(i, _c.set(SIGNAL));
      });
      l.instanceMatrix.needsUpdate = true;
      if (l.instanceColor) l.instanceColor.needsUpdate = true;
    }
  }, [data]);

  useLayoutEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      data.railGeoL.dispose();
      data.railGeoR.dispose();
    },
    [geos, mats, data],
  );

  useFrame((state) => {
    const root = rings.current?.parent;
    if (!root?.parent?.visible) return;
    const t = track.time;
    const cam = state.camera.position;

    // gates flare as the camera passes through them
    const r = rings.current;
    if (r) {
      data.gates.forEach((g, i) => {
        const d = _v.subVectors(g.pos, cam).dot(g.tangent);
        const flare = Math.exp(-(d * d) / 6);
        const near = 1 - THREE.MathUtils.smoothstep(Math.abs(d), 6, 40);
        r.setColorAt(i, _c.set(SIGNAL).multiplyScalar(0.5 + near * 1.6 + flare * 5 + spillAt(g.pos) * 3.5));
      });
      if (r.instanceColor) r.instanceColor.needsUpdate = true;
    }

    // rotating segment arcs around each gate pair
    const a = arcs.current;
    if (a) {
      let k = 0;
      for (let gi = 0; gi < data.gates.length; gi += 2) {
        const g = data.gates[gi];
        const dir = gi % 4 === 0 ? 1 : -1;
        for (let j = 0; j < ARCS_PER_GATE; j++) {
          const ang = dir * t * 0.22 + (j * Math.PI * 2) / ARCS_PER_GATE + gi;
          _q.copy(g.quat).multiply(_q2.setFromAxisAngle(Z, ang));
          a.setMatrixAt(k++, _m.compose(g.pos, _q, _s.setScalar(1)));
        }
      }
      a.instanceMatrix.needsUpdate = true;
    }

    // drifting debris
    const d = debris.current;
    if (d) {
      data.bits.forEach((b, i) => {
        _q.setFromAxisAngle(b.axis, b.phase + t * b.speed);
        _v.copy(b.pos);
        _v.y += Math.sin(t * 0.4 + b.phase) * 0.3;
        d.setMatrixAt(i, _m.compose(_v, _q, _s.setScalar(b.scale)));
      });
      d.instanceMatrix.needsUpdate = true;
    }

    // runway lights: a pulse chases ahead of the camera, down the corridor
    const l = lights.current;
    if (l) {
      const n = data.lightU.length;
      for (let i = 0; i < n; i++) {
        const u = data.lightU[i];
        const wave = Math.pow(0.5 + 0.5 * Math.sin(u * 60 - t * 4.5), 6);
        const dist = cam.distanceTo(data.lightPos[i]);
        const near = 1 - THREE.MathUtils.smoothstep(dist, 4, 30);
        const spill = spillAt(data.lightPos[i]);
        l.setColorAt(i, _c.set(SIGNAL).multiplyScalar(0.3 + wave * 4 * (0.3 + near) + near * 0.8 + spill * 5));
      }
      if (l.instanceColor) l.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={rings} args={[geos.ring, mats.ring, data.gates.length]} frustumCulled={false} />
      <instancedMesh
        ref={arcs}
        args={[geos.arc, mats.arc, (data.gates.length / 2) * ARCS_PER_GATE]}
        frustumCulled={false}
      />
      <instancedMesh ref={debris} args={[geos.debris, mats.debris, DEBRIS]} frustumCulled={false} />
      <instancedMesh ref={lights} args={[geos.light, mats.light, data.lightPos.length]} frustumCulled={false} />
      <mesh geometry={data.railGeoL} material={mats.rail} />
      <mesh geometry={data.railGeoR} material={mats.rail} />
    </group>
  );
}
