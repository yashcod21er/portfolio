import * as THREE from 'three';
import { INTRO_ZOOM, PORTRAIT_FOCUS, PORTRAIT_SIZE, type PortraitFx } from './fx';
import { createGlyphAtlas, GLYPH_BANDS, GLYPH_VARIANTS } from './glyphAtlas';
import { portraitFrag, quadVert, shardVert, simFrag } from './shaders';
import { buildShardGeometry } from './shards';
import { FrameSequence, loadManifest } from './sequence';

const SIM_SIZE = 256;
/** Pointer delta (uv per frame) → injected flow. */
const FLOW_GAIN = 4;
const DELTA_CAP = 0.1;

/** Source lens, CSS px. */
const LENS_RADIUS = 124;
const LENS_GROW = 40;
const GLYPH_CELL = { w: 9, h: 13 } as const;

type RGB = [number, number, number];

export interface Palette {
  ink: RGB;
  ochre: RGB;
  bone: RGB;
}

interface TrailSim {
  targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  read: 0 | 1;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
}

function createTrailSim(gl: THREE.WebGLRenderer): TrailSim | null {
  const supported =
    gl.capabilities.isWebGL2 &&
    (gl.extensions.has('EXT_color_buffer_float') || gl.extensions.has('EXT_color_buffer_half_float'));
  if (!supported) return null;

  const opts = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget] = [
    new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, opts),
    new THREE.WebGLRenderTarget(SIM_SIZE, SIM_SIZE, opts),
  ];
  const material = new THREE.ShaderMaterial({
    vertexShader: quadVert,
    fragmentShader: simFrag,
    uniforms: {
      uPrev: { value: targets[0].texture },
      uMouse: { value: new THREE.Vector2(-10, -10) },
      uDelta: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uDecay: { value: 0.94 },
      uRadius: { value: 0.008 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { targets, read: 0, material, geometry, scene, camera };
}

export interface EngineOptions {
  src: string;
  /** Depth map for the 3D relief (white = near). Optional: without it the photo stays flat. */
  depthSrc?: string;
  palette: Palette;
  onReady: () => void;
  onError: () => void;
}

/**
 * Imperative WebGL portrait: a full-screen quad with the portrait shader, plus a
 * half-float ping-pong trail simulation driven by the pointer. While the photo is
 * shattered the quad is swapped for a Voronoi shard mesh that runs the same fragment
 * shader. Lives outside React state so the render loop can mutate freely.
 */
export class PortraitEngine {
  private readonly gl: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly uniforms: Record<string, THREE.IUniform>;
  private readonly material: THREE.ShaderMaterial;
  private readonly shardMaterial: THREE.ShaderMaterial;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly mesh: THREE.Mesh;
  private readonly shardMesh: THREE.Mesh;
  private readonly blank: THREE.DataTexture;
  private readonly sim: TrailSim | null;
  private readonly onReady: () => void;
  private readonly prevClear = new THREE.Color();
  private readonly prevClearAlpha: number;
  private texture: THREE.Texture | null = null;
  private atlas: THREE.Texture | null = null;
  private hasShards = false;
  private shardId = 0;
  private last = { u: 0, v: 0, valid: false };
  private hover = 0;
  private vel = 0;
  private lens = { x: 0, y: 0, r: LENS_RADIUS, amt: 0 };
  private depth: THREE.Texture | null = null;
  /** the head's turn, eased toward its target each frame */
  private tilt = { x: -1, y: 0 };
  private relief = 0;
  /** optional video of Yash, cut into frames by `npm run sequence` */
  private seq: FrameSequence | null = null;
  private seqColor: THREE.Texture | null = null;
  private seqDepth: THREE.Texture | null = null;
  private seqShown = 0;
  private seqLast: ImageBitmap | null = null;
  private readyFired = false;
  private disposed = false;

  constructor(gl: THREE.WebGLRenderer, scene: THREE.Scene, opts: EngineOptions) {
    this.gl = gl;
    this.scene = scene;
    this.onReady = opts.onReady;
    this.sim = createTrailSim(gl);

    // shard gaps show the page ink (raw values: this pipeline does no colour management)
    gl.getClearColor(this.prevClear);
    this.prevClearAlpha = gl.getClearAlpha();
    gl.setClearColor(new THREE.Color().setRGB(...opts.palette.ink, THREE.LinearSRGBColorSpace), 1);

    this.blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.blank.needsUpdate = true;

    this.uniforms = {
      uTex: { value: this.blank },
      uTrail: { value: this.blank },
      uAtlas: { value: this.blank },
      uRes: { value: new THREE.Vector2(1, 1) },
      uImg: { value: new THREE.Vector2(PORTRAIT_SIZE.w, PORTRAIT_SIZE.h) },
      // texture UVs run bottom-up, the focus constant is top-down
      uFocus: { value: new THREE.Vector2(PORTRAIT_FOCUS.x, 1 - PORTRAIT_FOCUS.y) },
      uInk: { value: new THREE.Vector3(...opts.palette.ink) },
      uOchre: { value: new THREE.Vector3(...opts.palette.ochre) },
      uBone: { value: new THREE.Vector3(...opts.palette.bone) },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntro: { value: 1 },
      uIntroZoom: { value: INTRO_ZOOM },
      uHover: { value: 0 },
      uVel: { value: 0 },
      uLens: { value: new THREE.Vector2(-1e4, -1e4) },
      uLensR: { value: 1 },
      uLensAmt: { value: 0 },
      uCell: { value: new THREE.Vector2(GLYPH_CELL.w, GLYPH_CELL.h) },
      uGlyphGrid: { value: new THREE.Vector2(GLYPH_VARIANTS, GLYPH_BANDS) },
      uShatter: { value: 0 },
      uCrack: { value: 0 },
      uFlash: { value: 0 },
      uImpact: { value: new THREE.Vector2(-10, -10) },
      uAspect: { value: 1 },
      uDepth: { value: this.blank },
      uTilt: { value: new THREE.Vector2() },
      uRelief: { value: 0 },
    };

    // both materials share one uniforms object
    this.material = new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: portraitFrag,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    this.shardMaterial = new THREE.ShaderMaterial({
      vertexShader: shardVert,
      fragmentShader: portraitFrag,
      uniforms: this.uniforms,
      defines: { SHARD: '' },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);

    this.shardMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.shardMaterial);
    this.shardMesh.frustumCulled = false;
    this.shardMesh.visible = false;
    scene.add(this.shardMesh);

    new THREE.TextureLoader().load(
      opts.src,
      (tex) => {
        if (this.disposed) {
          tex.dispose();
          return;
        }
        // Raw sRGB in, raw sRGB out: no colour-space conversion anywhere in this pipeline.
        tex.colorSpace = THREE.NoColorSpace;
        tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        tex.needsUpdate = true;
        this.texture = tex;
        this.uniforms.uTex.value = tex;
        this.mesh.visible = true;
      },
      undefined,
      () => {
        if (!this.disposed) opts.onError();
      },
    );

    // The 3D relief is an enhancement too: without the depth map the photo stays flat.
    if (opts.depthSrc) {
      new THREE.TextureLoader().load(
        opts.depthSrc,
        (tex) => {
          if (this.disposed) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.NoColorSpace;
          tex.generateMipmaps = false;
          tex.minFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          this.depth = tex;
          this.uniforms.uDepth.value = tex;
        },
        undefined,
        () => {},
      );
    }

    // A clip of Yash, if one has been generated: it replaces the still photo frame by frame.
    void loadManifest().then((m) => {
      if (!m || this.disposed) return;
      this.seq = new FrameSequence(m);
      const mk = () => {
        const t = new THREE.Texture();
        t.colorSpace = THREE.NoColorSpace;
        t.flipY = false; // bitmaps are decoded pre-flipped
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        return t;
      };
      this.seqColor = mk();
      this.seqDepth = mk();
      this.seqDepth.generateMipmaps = false;
      this.seqDepth.minFilter = THREE.LinearFilter;
      (this.uniforms.uImg.value as THREE.Vector2).set(m.width, m.height);
      (this.uniforms.uFocus.value as THREE.Vector2).set(m.focus.x, 1 - m.focus.y);
    });

    // The lens is an enhancement: without the atlas it simply never opens.
    void createGlyphAtlas()
      .then((atlas) => {
        if (!atlas) return;
        if (this.disposed) {
          atlas.texture.dispose();
          return;
        }
        this.atlas = atlas.texture;
        this.uniforms.uAtlas.value = atlas.texture;
        (this.uniforms.uGlyphGrid.value as THREE.Vector2).copy(atlas.grid);
      })
      .catch(() => {});
  }

  /** One frame. `width`/`height` in CSS px. */
  frame(fx: PortraitFx, width: number, height: number, dpr: number, rawDelta: number) {
    if (!this.texture) return;
    const dt = Math.min(rawDelta, 1 / 20);
    const u = this.uniforms;
    const rect = this.gl.domElement.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const damp = THREE.MathUtils.damp;

    // pointer in canvas UV (y up)
    const pu = (fx.px - rect.left) / rect.width;
    const pv = 1 - (fx.py - rect.top) / rect.height;
    let du = 0;
    let dv = 0;
    if (fx.pointer && this.last.valid) {
      du = pu - this.last.u;
      dv = pv - this.last.v;
      const len = Math.hypot(du, dv);
      if (len > DELTA_CAP) {
        du *= DELTA_CAP / len;
        dv *= DELTA_CAP / len;
      }
    }
    this.last = { u: pu, v: pv, valid: fx.pointer };

    const inside = fx.pointer && pu >= 0 && pu <= 1 && pv >= 0 && pv <= 1;
    const speed = Math.min((Math.hypot(du, dv) / Math.max(dt, 1e-3)) * 0.35, 1);
    this.hover = damp(this.hover, inside ? 1 : 0, 3.5, dt);
    this.vel = damp(this.vel, speed, 6, dt);

    const sim = this.sim;
    if (sim) {
      const m = sim.material.uniforms;
      m.uPrev.value = sim.targets[sim.read].texture;
      m.uMouse.value.set(pu, pv);
      m.uDelta.value.set(du * FLOW_GAIN, dv * FLOW_GAIN);
      m.uAspect.value = rect.width / rect.height;
      m.uDecay.value = Math.pow(0.94, dt * 60);
      const write = sim.read === 0 ? 1 : 0;
      this.gl.setRenderTarget(sim.targets[write]);
      this.gl.render(sim.scene, sim.camera);
      this.gl.setRenderTarget(null);
      sim.read = write;
      u.uTrail.value = sim.targets[write].texture;
    }

    // ---- source lens: fine pointers inside the canvas, or a finger held / just lifted
    const lens = this.lens;
    const wantLens =
      !!this.atlas &&
      fx.scroll < 0.4 &&
      ((fx.mouse && inside) || fx.lensHold || performance.now() < fx.lensUntil);
    const lx = fx.px - rect.left;
    const ly = fx.py - rect.top;
    if (lens.amt < 0.01) {
      lens.x = lx;
      lens.y = ly;
    } else {
      lens.x = damp(lens.x, lx, 20, dt);
      lens.y = damp(lens.y, ly, 20, dt);
    }
    lens.amt = damp(lens.amt, wantLens ? 1 : 0, wantLens ? 6 : 4.5, dt);
    if (lens.amt < 0.002 && !wantLens) lens.amt = 0;
    lens.r = damp(lens.r, LENS_RADIUS + LENS_GROW * this.vel, 4, dt);
    const pop = 1 - Math.pow(1 - Math.min(lens.amt, 1), 3);
    u.uLens.value.set(lens.x * dpr, (height - lens.y) * dpr);
    u.uLensR.value = lens.r * dpr * (0.6 + 0.4 * pop);
    u.uLensAmt.value = lens.amt;
    u.uCell.value.set(GLYPH_CELL.w * dpr, GLYPH_CELL.h * dpr);

    // ---- shatter: re-seed on a new break, swap the quad for the shard mesh while active
    const aspect = rect.width / rect.height;
    if (fx.shatterId !== this.shardId) {
      this.shardId = fx.shatterId;
      const ox = (fx.sx - rect.left) / rect.width;
      const oy = 1 - (fx.sy - rect.top) / rect.height;
      const prev = this.shardMesh.geometry;
      this.shardMesh.geometry = buildShardGeometry({ x: ox, y: oy }, aspect);
      prev.dispose();
      this.hasShards = true;
      u.uImpact.value.set(ox, oy);
    }
    const shattered = this.hasShards && (fx.crack > 0.001 || Math.abs(fx.shatter) > 1e-4 || fx.flash > 0.001);
    this.mesh.visible = !shattered;
    this.shardMesh.visible = shattered;
    u.uShatter.value = fx.shatter;
    u.uCrack.value = fx.crack;
    u.uFlash.value = fx.flash;
    u.uAspect.value = aspect;

    // ---- 3D relief: the head turns toward the pointer, sways when idle, faces you
    // as the intro lands and tips back as the hero scrolls away
    const t = u.uTime.value as number;
    let tx: number;
    let ty: number;
    if (fx.mouse && fx.pointer) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tx = THREE.MathUtils.clamp((fx.px - cx) / (window.innerWidth * 0.5), -1, 1);
      ty = THREE.MathUtils.clamp(-(fx.py - cy) / (window.innerHeight * 0.5), -1, 1);
    } else {
      tx = Math.sin(t * 0.42) * 0.45;
      ty = Math.sin(t * 0.29 + 1.3) * 0.2;
    }
    tx -= (1 - fx.intro) * 1.1;
    ty -= fx.scroll * 0.9;
    this.tilt.x = damp(this.tilt.x, tx, 3, dt);
    this.tilt.y = damp(this.tilt.y, ty, 3, dt);
    // ---- clip: the cursor (or the idle sway) scrubs the "look" frames; scrolling plays the rest
    let reliefTarget = this.depth ? 1 : 0;
    const seq = this.seq;
    if (seq && this.seqColor && this.seqDepth) {
      const m = seq.manifest;
      const last = m.frames - 1;
      const scrollT = THREE.MathUtils.clamp(fx.scroll / 0.7, 0, 1);
      let target: number;
      if (m.loop) {
        // a living portrait: ping-pong through the clip so it never jumps at the seam
        const span = Math.max(1, last);
        const p = (t * (m.fps ?? 20)) % (2 * span);
        target = p < span ? p : 2 * span - p;
        this.seqShown = target;
      } else if (m.look) {
        const [a, b] = m.look;
        const lookIdx = a + (THREE.MathUtils.clamp(this.tilt.x, -1, 1) * 0.5 + 0.5) * (b - a);
        const playIdx = b < last ? b + scrollT * (last - b) : lookIdx;
        target = THREE.MathUtils.lerp(lookIdx, playIdx, THREE.MathUtils.smoothstep(fx.scroll, 0, 0.08));
      } else {
        target = scrollT * last;
      }
      this.seqShown = damp(this.seqShown, target, 9, dt);
      const k = Math.round(this.seqShown);
      seq.prefetch(k);
      const f = seq.nearest(k);
      if (f && f.color !== this.seqLast) {
        this.seqLast = f.color;
        this.seqColor.image = f.color;
        this.seqColor.needsUpdate = true;
        u.uTex.value = this.seqColor;
        if (f.depth) {
          this.seqDepth.image = f.depth;
          this.seqDepth.needsUpdate = true;
          u.uDepth.value = this.seqDepth;
        }
      }
      // the clip already turns the head: keep a lighter relief, and none without depth maps
      reliefTarget = m.depth ? 0.6 : 0;
    }
    this.relief = damp(this.relief, reliefTarget, 2.5, dt);
    u.uTilt.value.set(this.tilt.x, this.tilt.y);
    u.uRelief.value = this.relief;

    u.uRes.value.set(width * dpr, height * dpr);
    u.uDpr.value = dpr;
    u.uTime.value += dt;
    u.uScroll.value = fx.scroll;
    u.uIntro.value = fx.intro;
    u.uHover.value = this.hover;
    u.uVel.value = this.vel;

    if (!this.readyFired) {
      this.readyFired = true;
      // after this frame has actually been drawn
      window.setTimeout(this.onReady, 60);
    }
  }

  dispose() {
    this.disposed = true;
    this.scene.remove(this.mesh);
    this.scene.remove(this.shardMesh);
    this.gl.setClearColor(this.prevClear, this.prevClearAlpha);
    this.geometry.dispose();
    this.shardMesh.geometry.dispose();
    this.material.dispose();
    this.shardMaterial.dispose();
    this.blank.dispose();
    this.texture?.dispose();
    this.depth?.dispose();
    this.seq?.dispose();
    this.seqColor?.dispose();
    this.seqDepth?.dispose();
    this.atlas?.dispose();
    if (this.sim) {
      this.sim.targets.forEach((t) => t.dispose());
      this.sim.material.dispose();
      this.sim.geometry.dispose();
    }
  }
}
