import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PORTRAIT_DEPTH_SRC, type PortraitFx } from './fx';
import { PortraitEngine, type Palette } from './portraitEngine';

interface Props {
  fx: PortraitFx;
  src: string;
  /** false pauses the render loop (hero off screen) */
  active: boolean;
  /** page tokens as 0–1 RGB: ink (slice dissolve, shard gaps, lens ground), ochre + bone (glyphs, rims) */
  palette: Palette;
  onReady: () => void;
  onError: () => void;
}

function PortraitScene({ fx, src, palette, onReady, onError }: Omit<Props, 'active'>) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const engine = useRef<PortraitEngine | null>(null);
  const callbacks = useRef({ onReady, onError });

  useEffect(() => {
    callbacks.current = { onReady, onError };
  }, [onReady, onError]);

  useEffect(() => {
    const instance = new PortraitEngine(gl, scene, {
      src,
      depthSrc: PORTRAIT_DEPTH_SRC,
      palette,
      onReady: () => callbacks.current.onReady(),
      onError: () => callbacks.current.onError(),
    });
    engine.current = instance;
    return () => {
      instance.dispose();
      engine.current = null;
    };
  }, [gl, scene, src, palette]);

  useFrame((state, delta) => {
    engine.current?.frame(fx, state.size.width, state.size.height, state.viewport.dpr, delta);
  });

  return null;
}

/** WebGL portrait. Lazy-loaded by Hero; render errors are caught by GLBoundary. */
export default function PortraitCanvas({ active, ...rest }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      flat
      linear
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <PortraitScene {...rest} />
    </Canvas>
  );
}
