import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import type { Line2, LineSegments2 } from 'three-stdlib';
import { projectsData } from '../../data/projectsData';
import type { Project } from '../../types/portfolio';
import { useSite } from '../../lib/store';
import { sfx } from '../../lib/sound';
import { pathPoint, pathTangent } from '../layout';
import { runtime } from '../runtime';
import { useWorld } from '../store';
import {
  BONE_TEXT,
  GLOW_PLANE,
  RED_TEXT,
  SIGNAL,
  TEXT_MAT,
  UP,
  chapterActive,
  hot,
  localToGlobal,
  makeGlowMaterial,
  smooth,
  track,
  usePrecompile,
  type TroikaText,
} from './shared';
import { WORK_COUNT, activeWorkIndex, workLocalUnclamped, workScreenPose, type WorkScreenPose } from './workStops';
import { WorkCorridor } from './WorkCorridor';
import { workLive } from './workLive';

/* =============================================================================================
   Chapter "work": the four projects as large curved screens, all on the right of the corridor
   (the overlay's project list owns the left). Each screen approaches from deep in the corridor,
   docks in front of the camera for its segment (see workStops.ts) with a lock-on (scan sweep +
   bracket snap), then swings aside as the next one takes over. Lit screens throw red light on
   the floor, the rails and the gate rings. Hover brightens, click opens the case study.
============================================================================================= */

const SCREEN_W = 4.0;
const SCREEN_H = 2.5; // 16:10
const BEND = 0.2; // how far the screen's side edges curve toward the viewer
/** Height of the corridor floor (runway rails) below the camera path. */
const FLOOR_DOWN = 1.9;
/** Screens only react to the pointer once they are this powered (i.e. docked). */
const INTERACTIVE_POWER = 0.55;
/** Lock-on timings (seconds). */
const SCAN_TIME = 0.85;
const SNAP_TIME = 0.55;

const bendZ = (x: number) => BEND * Math.pow(x / (SCREEN_W / 2), 2);

function curvedPlane(w: number, h: number, segX: number, zOffset = 0) {
  const g = new THREE.PlaneGeometry(w, h, segX, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, bendZ(pos.getX(i)) + zOffset);
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/** Thin bezel that follows the curved panel. */
function framePoints(pad: number): THREE.Vector3[] {
  const hw = SCREEN_W / 2 + pad;
  const hh = SCREEN_H / 2 + pad;
  const pts: THREE.Vector3[] = [];
  const N = 24;
  const z = (x: number) => bendZ(x) + 0.01;
  for (let i = 0; i <= N; i++) {
    const x = -hw + (2 * hw * i) / N;
    pts.push(new THREE.Vector3(x, hh, z(x)));
  }
  for (let i = 0; i <= N; i++) {
    const x = hw - (2 * hw * i) / N;
    pts.push(new THREE.Vector3(x, -hh, z(x)));
  }
  pts.push(new THREE.Vector3(-hw, hh, z(-hw)));
  return pts;
}

/** Four L-shaped corner brackets (segment pairs), HUD style. */
function bracketPoints(pad: number, len: number): THREE.Vector3[] {
  const hw = SCREEN_W / 2 + pad;
  const hh = SCREEN_H / 2 + pad;
  const out: THREE.Vector3[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * hw;
      const y = sy * hh;
      const z = bendZ(x) + 0.02;
      const corner = new THREE.Vector3(x, y, z);
      out.push(corner, new THREE.Vector3(x - sx * len, y, bendZ(x - sx * len) + 0.02));
      out.push(corner.clone(), new THREE.Vector3(x, y - sy * len, z));
    }
  }
  return out;
}

/* ------------------------------------------- shaders ------------------------------------------- */

const screenVert = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const screenFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uPower;
  uniform float uFlicker;
  uniform float uHover;
  uniform float uTime;
  uniform float uImgAspect;
  uniform float uAspect;
  uniform vec2 uParallax;
  uniform float uScan;
  uniform float uFlash;
  varying vec2 vUv;
  #include <fog_pars_fragment>

  void main() {
    vec2 uv = vUv;
    vec2 c = uv - 0.5;

    // cover-fit the screenshot with a little overscan, so it can drift behind the glass
    // (parallax: the image sits deeper than the bezel), plus a hint of CRT barrel
    vec2 sc = vec2(1.0);
    if (uImgAspect > uAspect) sc.x = uAspect / uImgAspect; else sc.y = uImgAspect / uAspect;
    vec2 tuv = c * sc * 0.9 * (1.0 - 0.035 * dot(c, c)) + 0.5 - uParallax * sc * 0.045;

    float on = smoothstep(0.12, 0.95, uPower);
    // horizontal tearing while the tube flickers in
    tuv.x += (1.0 - uFlicker) * sin(uv.y * 90.0 + uTime * 47.0) * 0.012;

    float ca = 0.0016 + (1.0 - on) * 0.006 + uHover * 0.002 + uFlash * 0.006;
    vec3 col;
    col.r = texture2D(uMap, tuv + vec2(ca, 0.0)).r;
    col.g = texture2D(uMap, tuv).g;
    col.b = texture2D(uMap, tuv - vec2(ca, 0.0)).b;

    // dormant: a dim red monochrome ghost of the image
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    vec3 dormant = vec3(1.0, 0.13, 0.09) * lum * 0.8;
    col = mix(dormant, col, on);

    // lock-on scan: a hot line sweeps top → bottom; above it the image is freshly lit,
    // below it still dormant red
    if (uScan < 1.0) {
      float yLine = 1.06 - uScan * 1.12;
      float dy = uv.y - yLine;
      float below = 1.0 - step(0.0, dy);
      col = mix(col, dormant * 0.9, below * 0.85);
      float line = exp(-pow(dy * 70.0, 2.0));
      float wake = step(0.0, dy) * exp(-dy * 9.0);
      col += vec3(1.0, 0.3, 0.24) * (line * 2.6 + wake * 0.35) * (1.0 - uScan * uScan);
    }

    // scanlines + a slow refresh band
    col *= 0.86 + 0.14 * sin(uv.y * 620.0);
    float band = exp(-pow((fract(uTime * 0.13) * 1.4 - 0.2 - (1.0 - uv.y)) * 12.0, 2.0));
    col += band * vec3(1.0, 0.28, 0.22) * 0.08 * on;

    // vignette
    col *= mix(0.6, 1.0, 1.0 - smoothstep(0.3, 0.8, length(c * vec2(1.0, 1.2))));

    // inner red edge glow
    float e = max(abs(c.x), abs(c.y)) * 2.0;
    col += vec3(1.0, 0.12, 0.08) * smoothstep(0.9, 1.0, e) * (0.35 + uHover * 1.2 + uFlash * 2.0) * on;

    float bright = (0.07 + uPower * 0.95 + 0.2 * uHover) * uFlicker;
    col *= bright;

    // glass: a sweeping diagonal sheen + soft top reflection
    float diag = uv.x * 0.7 + uv.y;
    float sweep = fract(uTime * 0.06 + uHover * 0.2) * 3.2 - 0.8;
    float sheen = smoothstep(0.09, 0.0, abs(diag - sweep)) * (0.06 + uHover * 0.08);
    float topGloss = smoothstep(0.55, 1.0, uv.y) * smoothstep(1.0, 0.2, uv.x) * 0.05;
    col += vec3(1.0, 0.85, 0.82) * (sheen + topGloss) * (0.3 + on);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function makeScreenMaterial(map: THREE.Texture) {
  const img = map.image as { width?: number; height?: number } | undefined;
  const imgAspect = img?.width && img?.height ? img.width / img.height : 1.9;
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uMap: { value: map },
      uPower: { value: 0 },
      uFlicker: { value: 1 },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uImgAspect: { value: imgAspect },
      uAspect: { value: SCREEN_W / SCREEN_H },
      uParallax: { value: new THREE.Vector2() },
      uScan: { value: 1 },
      uFlash: { value: 0 },
    },
    vertexShader: screenVert,
    fragmentShader: screenFrag,
    fog: true,
    toneMapped: false,
  });
}

/* ------------------------------------------- one screen ------------------------------------------- */

interface Shared {
  screen: THREE.BufferGeometry;
  backing: THREE.BufferGeometry;
  frame: THREE.Vector3[];
  brackets: THREE.Vector3[];
}

const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _side = new THREE.Vector3();
const _up = new THREE.Vector3();
const _v = new THREE.Vector3();
const _n = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _qCam = new THREE.Quaternion();
const _qFold = new THREE.Quaternion();
const _qInv = new THREE.Quaternion();
const _origin = new THREE.Vector3();
const _lineColor = new THREE.Color();
const BASE_YAW = 0.5;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** easeOutBack: overshoots a touch past 1, then settles. */
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function ProjectScreen({
  project,
  index,
  texture,
  shared,
}: {
  project: Project;
  index: number;
  texture: THREE.Texture;
  shared: Shared;
}) {
  const group = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const spill = useRef<THREE.Mesh>(null);
  const frameLine = useRef<Line2 | LineSegments2>(null);
  const brackets = useRef<Line2 | LineSegments2>(null);
  const bracketGroup = useRef<THREE.Group>(null);
  const idxText = useRef<TroikaText>(null);
  const catText = useRef<TroikaText>(null);
  const titleText = useRef<TroikaText>(null);
  const tagText = useRef<TroikaText>(null);
  const hintText = useRef<TroikaText>(null);

  const material = useMemo(() => makeScreenMaterial(texture), [texture]);
  const glow = useMemo(() => makeGlowMaterial(hot(1), 0, 1.7), []);
  const spillMat = useMemo(() => makeGlowMaterial(hot(1), 0, 1.5), []);
  const backingMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#050304', side: THREE.DoubleSide }), []);
  const pose = useMemo<WorkScreenPose>(
    () => ({ at: 0, ahead: 0, lateral: 0, lift: 0, dismiss: 0, fold: 0, docked: 0 }),
    [],
  );
  const st = useRef({ power: 0, hover: 0, hovered: false, wasOn: false, onAt: -10, locked: false, lockAt: -10 });
  // three objects are mutated every frame through this ref (not through the memoised values)
  const liveRef = useRef({ material, glow, spillMat, backingMat, pose });

  useLayoutEffect(() => {
    const live = liveRef.current;
    const s = st.current;
    return () => {
      live.material.dispose();
      live.glow.dispose();
      live.spillMat.dispose();
      live.backingMat.dispose();
      workLive.light[index] = 0;
      if (s.hovered) document.body.style.cursor = '';
    };
  }, [index]);

  const nn = String(index + 1).padStart(2, '0');
  const tt = String(WORK_COUNT).padStart(2, '0');

  useFrame((state, delta) => {
    const s = st.current;
    const live = liveRef.current;
    if (!group.current?.parent?.visible || !pivot.current) {
      workLive.light[index] = 0;
      if (s.hovered) {
        s.hovered = false;
        document.body.style.cursor = '';
      }
      return;
    }
    const t = track.time;
    const dt = Math.min(delta, 0.1);
    const cam = state.camera.position;

    // where the choreography puts this screen for the camera's actual position
    const camLocal = workLocalUnclamped(runtime.camU);
    const pz = workScreenPose(index, camLocal, live.pose);
    const p = localToGlobal('work', pz.at);
    pathPoint(p, _pos);
    pathTangent(p, _tan);
    _side.crossVectors(_tan, UP).normalize();
    _up.crossVectors(_side, _tan).normalize();
    const g = group.current;
    g.position.copy(_pos).addScaledVector(_side, pz.lateral).addScaledVector(_up, pz.lift);
    g.position.y += Math.sin(t * 0.55 + index * 1.9) * 0.05;

    // the screen in focus: docked in front of the camera, not yet swinging away
    const isActive = activeWorkIndex(camLocal) === index;
    const locked = isActive && pz.ahead > 2 && pz.ahead < 16 && pz.dismiss < 0.4;
    if (locked && !s.locked) {
      s.locked = true;
      s.lockAt = t;
    } else if (!locked && s.locked) s.locked = false;
    const lt = t - s.lockAt;

    // power: the locked screen is fully lit, waiting ones glow dimly, dismissed ones fade
    const near = 1 - smooth(pz.ahead, 12, 34);
    let target = locked ? 1 : 0.1 + 0.3 * near;
    target *= 1 - 0.8 * pz.dismiss;
    if (pz.ahead < 0.5) target = 0;
    s.power = THREE.MathUtils.damp(s.power, target, 3.2, dt);

    // power-on flicker
    if (!s.wasOn && s.power > 0.18) {
      s.wasOn = true;
      s.onAt = t;
    } else if (s.wasOn && s.power < 0.06) s.wasOn = false;
    const since = t - s.onAt;
    let flicker = 1;
    if (since < 0.7) flicker = hash(Math.floor(t * 26) + index * 13.7) < 0.3 + since * 1.1 ? 1 : 0.12;
    flicker *= 0.975 + 0.025 * Math.sin(t * 61 + index);

    // pointer
    if (s.hovered && s.power < INTERACTIVE_POWER * 0.7) {
      s.hovered = false;
      document.body.style.cursor = '';
    }
    s.hover = THREE.MathUtils.damp(s.hover, s.hovered ? 1 : 0, 8, dt);

    // orientation: from facing back up the corridor (yawed toward the path) to facing the
    // camera as it nears, then folding aside (toward the path, edge-on) when dismissed
    _n.copy(_tan).multiplyScalar(-Math.cos(BASE_YAW)).addScaledVector(_side, -Math.sin(BASE_YAW)).normalize();
    _m.lookAt(_n, _origin, _up);
    pivot.current.quaternion.setFromRotationMatrix(_m);
    _m.lookAt(_v.subVectors(cam, g.position).normalize(), _origin, UP);
    _qCam.setFromRotationMatrix(_m);
    pivot.current.quaternion.slerp(_qCam, 0.3 + 0.62 * near);
    _qFold.setFromAxisAngle(UP, -pz.fold);
    pivot.current.quaternion.multiply(_qFold);

    // lock-on: bracket snap (in from wide, overshoot, settle) + scan sweep + a flash
    const snap = s.locked && lt < SNAP_TIME ? 1 + 0.32 * (1 - easeOutBack(lt / SNAP_TIME)) : 1;
    const scan = s.locked && lt < SCAN_TIME ? lt / SCAN_TIME : 1;
    const flash = s.locked && lt >= 0 ? Math.exp(-lt * 4.5) : 0;
    pivot.current.scale.setScalar(0.94 + 0.06 * smooth(s.power, 0, 0.6) + s.hover * 0.03);

    // parallax: where the camera sits relative to the screen's face, plus the pointer
    _v.subVectors(cam, g.position).applyQuaternion(_qInv.copy(pivot.current.quaternion).invert());
    const lz = Math.max(_v.z, 0.5);
    const { pointer } = useWorld.getState();
    const u = live.material.uniforms;
    (u.uParallax.value as THREE.Vector2).set(
      THREE.MathUtils.clamp(_v.x / lz, -0.8, 0.8) * 0.7 + pointer.x * 0.3,
      THREE.MathUtils.clamp(_v.y / lz, -0.8, 0.8) * 0.7 + pointer.y * 0.2,
    );
    u.uPower.value = s.power;
    u.uFlicker.value = flicker;
    u.uHover.value = s.hover;
    u.uTime.value = t;
    u.uScan.value = scan;
    u.uFlash.value = flash;

    const light = s.power * flicker + flash * 0.6;
    live.glow.uniforms.uIntensity.value = (s.power * 0.5 + s.hover * 0.45 + flash * 0.6) * flicker;
    // red light thrown on the corridor floor, in front of the screen (toward the path)
    live.spillMat.uniforms.uIntensity.value = light * 0.42;
    if (spill.current) spill.current.position.set(-_side.x * 1.2, -(pz.lift + FLOOR_DOWN - 0.02), -_side.z * 1.2);
    workLive.pos[index].copy(g.position);
    workLive.light[index] = light;

    const lineK = (0.35 + s.power * 3.2 + s.hover * 3) * flicker + flash * 6;
    if (frameLine.current) {
      (frameLine.current.material as THREE.Material & { color: THREE.Color }).color.copy(_lineColor.set(SIGNAL).multiplyScalar(lineK));
    }
    if (brackets.current) {
      (brackets.current.material as THREE.Material & { color: THREE.Color }).color.copy(
        _lineColor.set(SIGNAL).multiplyScalar(lineK * 1.4 + 0.5 + flash * 6),
      );
    }
    if (bracketGroup.current) bracketGroup.current.scale.setScalar(snap + s.hover * 0.035);

    const textOn = smooth(s.power, 0.3, 0.85) * (since < 0.7 ? flicker : 1);
    if (idxText.current) idxText.current.fillOpacity = textOn;
    if (catText.current) catText.current.fillOpacity = textOn * 0.95;
    if (titleText.current) titleText.current.fillOpacity = textOn;
    if (tagText.current) tagText.current.fillOpacity = textOn * 0.8;
    if (hintText.current) hintText.current.fillOpacity = smooth(s.power, 0.6, 0.95) * (0.55 + 0.45 * s.hover);
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const s = st.current;
    if (s.power < INTERACTIVE_POWER || s.hovered) return;
    s.hovered = true;
    document.body.style.cursor = 'pointer';
    sfx.hover();
  };
  const onOut = () => {
    const s = st.current;
    if (!s.hovered) return;
    s.hovered = false;
    document.body.style.cursor = '';
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (st.current.power < INTERACTIVE_POWER) return;
    e.stopPropagation();
    sfx.click();
    useSite.getState().setActiveProject(project.slug);
  };

  const hw = SCREEN_W / 2;
  const hh = SCREEN_H / 2;

  return (
    <group ref={group}>
      {/* red light pooled on the corridor floor */}
      <mesh
        ref={spill}
        geometry={GLOW_PLANE}
        material={spillMat}
        rotation-x={-Math.PI / 2}
        scale={[SCREEN_W * 1.9, SCREEN_W * 2.4, 1]}
      />
      <group ref={pivot}>
        {/* halo behind */}
        <mesh geometry={GLOW_PLANE} material={glow} position={[0, 0, -0.3]} scale={[SCREEN_W * 2, SCREEN_H * 2.4, 1]} />
        {/* bezel / backing */}
        <mesh geometry={shared.backing} material={backingMat} />
        {/* the panel */}
        <mesh
          geometry={shared.screen}
          material={material}
          onPointerOver={onOver}
          onPointerMove={onOver}
          onPointerOut={onOut}
          onClick={onClick}
        />
        <Line ref={frameLine} points={shared.frame} lineWidth={1.4} color={hot(1)} toneMapped={false} transparent />
        <group ref={bracketGroup}>
          <Line ref={brackets} points={shared.brackets} segments lineWidth={2.4} color={hot(2)} toneMapped={false} />
        </group>

        {/* labels */}
        <Text
          ref={idxText}
          material={TEXT_MAT}
          position={[-hw - 0.04, hh + 0.24, 0.22]}
          fontSize={0.15}
          letterSpacing={0.18}
          anchorX="left"
          anchorY="bottom"
          color={RED_TEXT}
          fillOpacity={0}
        >
          {`${nn} / ${tt}`}
        </Text>
        <Text
          ref={catText}
          material={TEXT_MAT}
          position={[hw + 0.04, hh + 0.24, 0.22]}
          fontSize={0.12}
          letterSpacing={0.2}
          anchorX="right"
          anchorY="bottom"
          color={RED_TEXT}
          fillOpacity={0}
        >
          {`${project.category.toUpperCase()}  ·  ${project.status.toUpperCase()}`}
        </Text>
        <Text
          ref={titleText}
          material={TEXT_MAT}
          position={[-hw - 0.04, -hh - 0.24, 0.22]}
          fontSize={0.32}
          fontWeight={800}
          letterSpacing={-0.01}
          anchorX="left"
          anchorY="top"
          maxWidth={SCREEN_W * 0.74}
          color={BONE_TEXT}
          fillOpacity={0}
        >
          {project.title.toUpperCase()}
        </Text>
        <Text
          ref={tagText}
          material={TEXT_MAT}
          position={[-hw - 0.04, -hh - 0.66, 0.22]}
          fontSize={0.13}
          anchorX="left"
          anchorY="top"
          maxWidth={SCREEN_W * 0.74}
          color={BONE_TEXT}
          fillOpacity={0}
        >
          {project.tagline}
        </Text>
        <Text
          ref={hintText}
          material={TEXT_MAT}
          position={[hw + 0.04, -hh - 0.28, 0.22]}
          fontSize={0.12}
          letterSpacing={0.2}
          anchorX="right"
          anchorY="top"
          color={RED_TEXT}
          fillOpacity={0}
        >
          {'VIEW CASE  →'}
        </Text>
      </group>
    </group>
  );
}

/* ------------------------------------------- chapter root ------------------------------------------- */

const PROJECTS = projectsData.slice(0, WORK_COUNT);
const IMAGE_URLS: string[] = PROJECTS.map((p) => p.image ?? '/projects/airbnb-preview.png');

export function WorkScreens() {
  const warmRef = useRef({ frames: 0 });
  const root = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const textures = useLoader(THREE.TextureLoader, IMAGE_URLS);
  const texturesRef = useRef(textures);
  const shared = useMemo<Shared>(
    () => ({
      screen: curvedPlane(SCREEN_W, SCREEN_H, 40),
      backing: curvedPlane(SCREEN_W + 0.18, SCREEN_H + 0.18, 40, -0.03),
      frame: framePoints(0.09),
      brackets: bracketPoints(0.22, 0.3),
    }),
    [],
  );

  useLayoutEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    for (const t of texturesRef.current) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      t.needsUpdate = true;
      gl.initTexture(t);
    }
  }, [gl]);

  useLayoutEffect(
    () => () => {
      shared.screen.dispose();
      shared.backing.dispose();
    },
    [shared],
  );

  usePrecompile(root);

  useFrame(() => {
    if (root.current) root.current.visible = chapterActive('work', track.p, 0.1, 0.05, warmRef.current);
  });

  return (
    <group ref={root}>
      {PROJECTS.map((project, i) => (
        <ProjectScreen key={project.slug} project={project} index={i} texture={textures[i]} shared={shared} />
      ))}
      <WorkCorridor />
    </group>
  );
}
