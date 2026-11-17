import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PORTRAIT_POSITION } from './layout';
import { FrameSequence, loadManifest, type SequenceManifest } from './sequence';
import { FOG_DENSITY, HEX, lin } from './config';
import { INTRO_END } from './cameraPath';
import { runtime } from './runtime';
import { useWorld } from './store';
import { burstFrag, burstVert, haloFrag, haloVert, reliefFrag, reliefVert } from './portraitShaders';

const { damp, clamp, smoothstep } = THREE.MathUtils;

const WIDTH = 4.2;
const HEIGHT = WIDTH * 0.75;
const STILL = '/assets/yash-portrait.webp';
const STILL_DEPTH = '/assets/yash-depth.webp';
const MAX_YAW = THREE.MathUtils.degToRad(18);
const MAX_PITCH = THREE.MathUtils.degToRad(8);
/** Beyond this overall progress the portrait is gone: free the decoded clip. */
const FAR = INTRO_END * 1.25;

/** Intro-local schedule of the disintegration. */
const BURN_START = 0.4;
const BURN_SPAN = 0.18;

/** The rim sweep: first pass a moment after arrival, then once per period. */
const SWEEP_DELAY = 2.2;
const SWEEP_PERIOD = 8.5;
const SWEEP_DUR = 2.6;

const INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role="button"],[role="link"],[contenteditable]';

function makeTexture(color: boolean) {
  const t = new THREE.Texture();
  t.flipY = false; // FrameSequence bitmaps are decoded pre-flipped
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Jittered grid of the point-cloud twin. */
function burstGeometry(cols: number, rows: number) {
  const n = cols * rows;
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const rnd = new Float32Array(n * 4);
  let i = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      uv[i * 2] = (x + 0.2 + Math.random() * 0.6) / cols;
      uv[i * 2 + 1] = (y + 0.2 + Math.random() * 0.6) / rows;
      for (let k = 0; k < 4; k++) rnd[i * 4 + k] = Math.random();
      i++;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  return g;
}

/**
 * THE portrait: a depth-displaced relief mesh of the living-portrait clip, graded into the
 * red world and lit with a red rim. It turns toward the pointer, ripples when clicked, and as
 * the intro ends burns inward from its edges into a cloud of embers (a point-cloud twin
 * sampled from the same colour + depth) that streams past the camera.
 */
export default function Portrait({ coarse }: { coarse: boolean }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const points = useRef<THREE.Points>(null);
  const halo = useRef<THREE.Mesh>(null);

  const res = useMemo(() => {
    const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    blank.needsUpdate = true;
    const seqColor = makeTexture(true);
    const seqDepth = makeTexture(false);
    // sharp at grazing angles too (the relief turns toward the pointer)
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    seqColor.anisotropy = aniso;
    const segX = coarse ? 160 : 256;
    const segY = coarse ? 120 : 192;
    const relief = new THREE.PlaneGeometry(WIDTH, HEIGHT, segX, segY);
    const burst = coarse ? burstGeometry(96, 72) : burstGeometry(160, 120);
    const uniforms = {
      uColor: { value: blank as THREE.Texture },
      uDepth: { value: blank as THREE.Texture },
      uSize: { value: new THREE.Vector2(WIDTH, HEIGHT) },
      uDepthScale: { value: 2.0 },
      uFocusDepth: { value: 0.74 },
      uFace: { value: new THREE.Vector2(0.52, 0.6) },
      uBurn: { value: -0.3 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uRipple: { value: new THREE.Vector3(0.5, 0.5, -1) },
      uSignal: { value: lin(HEX.signal) },
      uSignalDeep: { value: lin(HEX.signalDeep) },
      uBone: { value: lin(HEX.bone) },
      uFogColor: { value: runtime.fogColor },
      uFogDensity: { value: FOG_DENSITY },
      uKeyDir: { value: new THREE.Vector3(-0.75, 0.45, 0.5).normalize() },
      uFillDir: { value: new THREE.Vector3(0.8, 0.1, 0.45).normalize() },
      uOpacity: { value: 1 },
      uCell: { value: WIDTH / (coarse ? 96 : 160) },
      uViewScale: { value: 800 },
      uLight: { value: new THREE.Vector4(0, 0, 0, 0) },
      uSweep: { value: new THREE.Vector4(0, 0, 1, 0) },
      uSweepX: { value: 0.5 },
    };
    const reliefMat = new THREE.ShaderMaterial({
      vertexShader: reliefVert,
      fragmentShader: reliefFrag,
      uniforms,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    const burstMat = new THREE.ShaderMaterial({
      vertexShader: burstVert,
      fragmentShader: burstFrag,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloUniforms = {
      uSignal: { value: lin(HEX.signal) },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
    };
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: haloVert,
      fragmentShader: haloFrag,
      uniforms: haloUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { blank, seqColor, seqDepth, relief, burst, uniforms, reliefMat, burstMat, haloMat, haloUniforms };
  }, [coarse, gl]);

  const s = useRef({
    manifest: undefined as SequenceManifest | null | undefined,
    seq: null as FrameSequence | null,
    last: null as ImageBitmap | null,
    hasSeqFrame: false,
    still: null as THREE.Texture | null,
    stillDepth: null as THREE.Texture | null,
    yaw: 0,
    pitch: 0,
    burstOn: 0,
    started: -1,
  });

  // still photo + depth (fallback, and what shows if the clip never arrives)
  useEffect(() => {
    let alive = true;
    const st = s.current;
    const loader = new THREE.TextureLoader();
    loader.load(STILL, (t) => {
      if (!alive) return t.dispose();
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      st.still = t;
    });
    loader.load(STILL_DEPTH, (t) => {
      if (!alive) return t.dispose();
      t.colorSpace = THREE.NoColorSpace;
      st.stillDepth = t;
    });
    void loadManifest().then((m) => {
      if (alive) st.manifest = m;
    });
    return () => {
      alive = false;
      st.seq?.dispose();
      st.seq = null;
      st.still?.dispose();
      st.stillDepth?.dispose();
    };
  }, [gl]);

  useEffect(
    () => () => {
      res.blank.dispose();
      res.seqColor.dispose();
      res.seqDepth.dispose();
      res.relief.dispose();
      res.burst.dispose();
      res.reliefMat.dispose();
      res.burstMat.dispose();
      res.haloMat.dispose();
    },
    [res],
  );

  // click / tap on the portrait: a ripple through the relief
  useEffect(() => {
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onDown = (e: PointerEvent) => {
      const m = mesh.current;
      if (!m || !m.visible || res.uniforms.uBurn.value > 0) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(m, false)[0];
      if (hit?.uv) res.uniforms.uRipple.value.set(hit.uv.x, hit.uv.y, 0);
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, [camera, res]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const st = s.current;
    const u = res.uniforms;
    const p = runtime.progress;
    const g = group.current;
    if (!g) return;

    // far from the intro: hide, release the decoded clip (~250 MB of bitmaps)
    if (p > FAR) {
      g.visible = false;
      if (st.seq) {
        st.seq.dispose();
        st.seq = null;
        st.last = null;
        st.hasSeqFrame = false;
      }
      return;
    }
    g.visible = true;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;

    // ---- living portrait: ping-pong through the clip, upload each new frame
    if (st.manifest && !st.seq) st.seq = new FrameSequence(st.manifest);
    const seq = st.seq;
    if (seq) {
      const m = seq.manifest;
      const span = Math.max(1, m.frames - 1);
      const f = (t * (m.fps ?? 20)) % (2 * span);
      const k = Math.round(f < span ? f : 2 * span - f);
      seq.prefetch(k);
      const fr = seq.nearest(k);
      if (fr && fr.color !== st.last) {
        st.last = fr.color;
        res.seqColor.image = fr.color;
        res.seqColor.needsUpdate = true;
        u.uColor.value = res.seqColor;
        if (fr.depth) {
          res.seqDepth.image = fr.depth;
          res.seqDepth.needsUpdate = true;
          u.uDepth.value = res.seqDepth;
        } else if (st.stillDepth) u.uDepth.value = st.stillDepth;
        st.hasSeqFrame = true;
      }
    }
    if (!st.hasSeqFrame) {
      // no clip (or not yet): the still photo, once the clip has had a fair chance
      if (st.started < 0) st.started = t;
      const giveUp = st.manifest === null || t - st.started > 2.5;
      if (giveUp && st.still && st.stillDepth) {
        u.uColor.value = st.still;
        u.uDepth.value = st.stillDepth;
      }
    }
    const hasImage = u.uColor.value !== res.blank;
    if (hasImage) runtime.portraitReady = true;

    // ---- arrival + scroll-out
    const local = clamp(p / INTRO_END, 0, 1);
    u.uReveal.value = hasImage ? runtime.arrival : 0;
    const burn = local < BURN_START ? -0.3 : (local - BURN_START) / BURN_SPAN - 0.06;
    u.uBurn.value = burn;
    if (mesh.current) mesh.current.visible = burn < 1.05;
    st.burstOn = local > BURN_START - 0.01 ? 1 : 0;
    if (points.current) points.current.visible = st.burstOn > 0 && local < 0.999;
    u.uViewScale.value = (state.size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(42) / 2));

    // ripple clock
    if (u.uRipple.value.z >= 0) {
      u.uRipple.value.z += dt;
      if (u.uRipple.value.z > 3) u.uRipple.value.z = -1;
    }

    // ---- turn toward the pointer (idle sway on touch), calmer once it starts to burn
    const { x: px, y: py } = useWorld.getState().pointer;
    const hasPointer = !coarse && (px !== 0 || py !== 0);
    const calm = 1 - smoothstep(local, BURN_START - 0.05, BURN_START + 0.15) * 0.7;
    const yawT = (hasPointer ? clamp(px, -1, 1) * MAX_YAW : Math.sin(t * 0.35) * MAX_YAW * 0.45) * calm;
    const pitchT = (hasPointer ? -clamp(py, -1, 1) * MAX_PITCH : Math.sin(t * 0.27 + 1.2) * MAX_PITCH * 0.4) * calm;
    st.yaw = damp(st.yaw, yawT, 2.4, dt);
    st.pitch = damp(st.pitch, pitchT, 2.4, dt);
    if (tilt.current) tilt.current.rotation.set(st.pitch, st.yaw, 0);

    // ---- the sweep: a red key light rakes across his face, left to right, every few seconds
    let sweep = 0;
    const since = runtime.readyAt >= 0 ? t - runtime.readyAt - SWEEP_DELAY : -1;
    if (since >= 0) {
      const sp = (since % SWEEP_PERIOD) / SWEEP_DUR;
      if (sp < 1) {
        const e = sp * sp * (3 - 2 * sp);
        const a = THREE.MathUtils.lerp(-1.15, 1.15, e);
        const sx = Math.sin(a);
        const sz = Math.cos(a) * 0.5;
        const n = 1 / Math.hypot(sx, 0.28, sz);
        u.uSweep.value.set(sx * n, 0.28 * n, sz * n, 0);
        u.uSweepX.value = THREE.MathUtils.lerp(0.2, 0.84, e);
        sweep = Math.pow(Math.sin(Math.PI * sp), 1.3) * runtime.arrival * (1 - smoothstep(local, 0.25, BURN_START));
      }
    }
    u.uSweep.value.w = sweep;

    // ---- the cursor's flashlight
    const l = runtime.cursorLight;
    u.uLight.value.set(l.x, l.y, l.z, runtime.cursorLightOn);

    // halo: rises with the arrival, flares as he burns, then gone
    const flare = Math.exp(-Math.pow((local - (BURN_START + 0.1)) / 0.07, 2));
    res.haloUniforms.uIntensity.value =
      runtime.arrival * (1 - smoothstep(local, BURN_START + 0.1, BURN_START + 0.3)) * (0.8 + sweep * 0.25) + flare * 0.45;
    res.haloUniforms.uTime.value = t;
    if (halo.current) halo.current.visible = res.haloUniforms.uIntensity.value > 0.003;
  });

  return (
    <group ref={group} position={PORTRAIT_POSITION}>
      <mesh ref={halo} position={[0.05, 0.55, -2.2]} material={res.haloMat} renderOrder={-1}>
        <planeGeometry args={[11, 11]} />
      </mesh>
      <group ref={tilt}>
        <mesh ref={mesh} geometry={res.relief} material={res.reliefMat} frustumCulled={false} />
        <points ref={points} geometry={res.burst} material={res.burstMat} frustumCulled={false} visible={false} />
      </group>
    </group>
  );
}
