import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

// Deterministic pseudo-random generator
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const StudioEnvironment: React.FC = () => {
  const { particleCount, reducedMotion, lampOn } = useSystem();
  const pointsRef = useRef<THREE.Points>(null);

  // Subtle floating dust particles in the studio light
  const [positions, scales] = useMemo(() => {
    const count = Math.min(particleCount, 80);
    const pos = new Float32Array(count * 3);
    const sca = new Float32Array(count);
    const rng = createSeededRandom(42);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * 14;
      pos[i * 3 + 1] = rng() * 6 - 0.5;
      pos[i * 3 + 2] = (rng() - 0.5) * 12;
      sca[i] = rng() * 0.04 + 0.02;
    }

    return [pos, sca];
  }, [particleCount]);

  useFrame(({ clock }) => {
    if (pointsRef.current && !reducedMotion) {
      const elapsed = clock.getElapsedTime() * 0.15;
      pointsRef.current.rotation.y = elapsed * 0.2;
    }
  });

  return (
    <>
      {/* Studio Fog smoothly fading into the architectural gallery background */}
      <color attach="background" args={[lampOn ? '#EFECE3' : '#F6F5F0']} />
      <fog attach="fog" args={[lampOn ? '#EFECE3' : '#F6F5F0', 8, 26]} />

      {/* Studio Lighting System */}
      {/* 1. Soft ambient light (crisp daylight vs warm golden hour) */}
      <ambientLight intensity={lampOn ? 0.72 : 0.85} color={lampOn ? '#FFF8E7' : '#FFFFFF'} />

      {/* 2. Primary studio key light */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={lampOn ? 1.2 : 1.5}
        color={lampOn ? '#FDE68A' : '#FFFDF7'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0005}
      />

      {/* 3. Subtle cobalt blue fill light from the left */}
      <directionalLight
        position={[-5, 4, -2]}
        intensity={0.4}
        color="#2563EB"
      />

      {/* 4. Soft overhead rim light */}
      <directionalLight
        position={[0, 6, -5]}
        intensity={0.5}
        color="#E0F2FE"
      />

      {/* Minimal Architectural Studio Floor Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#F6F5F0"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Photorealistic Soft Contact Shadow on Studio Floor */}
      <ContactShadows
        position={[0, -1.19, 0]}
        opacity={0.45}
        scale={12}
        blur={2.2}
        far={4}
        resolution={512}
        color="#111318"
      />

      {/* Quiet floating dust particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-scale"
            args={[scales, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#A8A29E"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>
    </>
  );
};
