import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ChromaticAberrationEffect, ToneMappingMode, type BloomEffect } from 'postprocessing';
import { runtime } from './runtime';

const BLOOM = 1.2;

/**
 * Bloom (HDR > ~0.9 glows) → ACES tone mapping → chromatic aberration that opens up with
 * scroll speed → film noise → vignette. No MSAA (the canvas has none either).
 * A chapter warp (runtime.warp) swells the bloom and splits the colour channels for a beat.
 */
export default function PostFX() {
  const ca = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0005, 0.0003),
        radialModulation: true,
        modulationOffset: 0.2,
      }),
    [],
  );
  useEffect(() => () => ca.dispose(), [ca]);

  const bloom = useRef<BloomEffect>(null);

  useFrame(() => {
    const w = runtime.warp;
    const k = 0.0005 + runtime.velocity * 0.0045 + w * 0.0055;
    ca.offset.set(k, k * 0.6);
    if (bloom.current) bloom.current.intensity = BLOOM + w * 1.6;
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={BLOOM} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <primitive object={ca} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.06} />
      <Vignette darkness={0.8} offset={0.3} />
    </EffectComposer>
  );
}
