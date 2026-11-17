import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { prefersReducedMotion } from '../lib/smooth';
import { useWorld } from './store';
import { FOG_DENSITY, HEX, isCoarsePointer } from './config';
import { runtime } from './runtime';
import CameraRig from './CameraRig';
import Atmosphere from './Atmosphere';
import Embers from './Embers';
import Portrait from './Portrait';
import PostFX from './PostFX';
import Warp from './Warp';
import CursorLight from './CursorLight';
import { Chapters } from './chapters';

// dev only: lets headless checks read the per-frame world state (warp, progress, …)
if (import.meta.env.DEV && typeof window !== 'undefined') Object.assign(window, { __worldRuntime: runtime });

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2');
    if (!ctx) return false;
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Marks the scene ready once the portrait has an image and a couple of frames have been
 * drawn (or after a cap, so the preloader never hangs on a slow network).
 */
function SceneReady() {
  const s = useRef({ frames: 0, start: -1, done: false });
  useFrame(({ clock }) => {
    const st = s.current;
    if (st.done) return;
    const t = clock.elapsedTime;
    if (st.start < 0) st.start = t;
    st.frames++;
    if ((runtime.portraitReady && st.frames > 3) || t - st.start > 5) {
      st.done = true;
      runtime.readyAt = t;
      // after this frame has been rendered
      requestAnimationFrame(() => useWorld.getState().setSceneReady());
    }
  });
  return null;
}

function Scene({ coarse, onDecline }: { coarse: boolean; onDecline: () => void }) {
  return (
    <>
      <color attach="background" args={[HEX.ink]} />
      <fogExp2 attach="fog" args={[HEX.fog, FOG_DENSITY]} />
      <CameraRig />
      <Warp />
      {!coarse && <CursorLight />}
      <Atmosphere />
      <Embers count={coarse ? 2000 : 6000} />
      <Portrait coarse={coarse} />
      <Suspense fallback={null}>
        <Chapters />
      </Suspense>
      <PostFX />
      <SceneReady />
      <PerformanceMonitor onDecline={onDecline} flipflops={2} />
    </>
  );
}

/**
 * The world: one fixed full-screen canvas behind the overlay. Renders nothing (and tells the
 * overlay to show its static fallback) without WebGL2 or with reduced motion on.
 */
export default function World() {
  const [enabled] = useState(() => typeof window !== 'undefined' && hasWebGL2() && !prefersReducedMotion());
  const [coarse] = useState(isCoarsePointer);
  const [dpr, setDpr] = useState(() =>
    coarse ? 1 : Math.min(1.5, Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio : 1)),
  );
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    if (!enabled) useWorld.getState().setWebgl(false);
  }, [enabled]);

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  const webgl = useWorld((s) => s.webgl);
  if (!enabled || !webgl) return null;

  return (
    <Canvas
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: HEX.ink }}
      // the canvas sits under the overlay with pointer-events off; route R3F pointer events
      // from the app root so chapter objects can still be hovered / clicked
      eventSource={document.getElementById('root') ?? undefined}
      eventPrefix="client"
      dpr={dpr}
      frameloop={hidden ? 'never' : 'always'}
      camera={{ fov: 42, near: 0.1, far: 400, position: [0, 0.15, 8.5] }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', () => useWorld.getState().setWebgl(false), {
          once: true,
        });
      }}
    >
      <Scene coarse={coarse} onDecline={() => setDpr(1)} />
    </Canvas>
  );
}
