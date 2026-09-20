import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

// Pure deterministic pseudo-random generator
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const SpaceEnvironment: React.FC = () => {
  const { particleCount, theme } = useSystem();
  const pointsRef = useRef<THREE.Points>(null);

  const isLight = theme === 'light';

  // Generate deterministic lightweight particle coordinates without Math.random impurities
  const [positions, colors] = useMemo(() => {
    const rng = createSeededRandom(42);
    const count = Math.max(50, particleCount);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color(isLight ? '#0284C7' : '#39DFFF');
    const violet = new THREE.Color(isLight ? '#7C3AED' : '#9B7BFF');
    const neutral = new THREE.Color(isLight ? '#475569' : '#FFFFFF');

    for (let i = 0; i < count; i++) {
      // Spread across a cylinder/sphere in space
      const radius = 15 + rng() * 45;
      const theta = rng() * Math.PI * 2;
      const phi = (rng() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      pos[i * 3 + 1] = radius * Math.sin(phi) + (rng() - 0.5) * 20;
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const choice = rng();
      const color = choice < 0.45 ? cyan : choice < 0.85 ? violet : neutral;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return [pos, col];
  }, [particleCount, isLight]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <group>
      {/* Soft atmospheric fog matching theme background */}
      <fog attach="fog" args={[isLight ? '#F1F5F9' : '#080B16', 20, 75]} />

      {/* Ambient Cosmos Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isLight ? 0.2 : 0.16}
          vertexColors
          transparent
          opacity={isLight ? 0.85 : 0.7}
          blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
