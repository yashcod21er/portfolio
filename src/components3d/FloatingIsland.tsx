import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const FloatingIsland: React.FC = () => {
  const { theme } = useSystem();
  const groupRef = useRef<THREE.Group>(null);
  const isLight = theme === 'light';

  // Subtle floating levitation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = -1.2 + Math.sin(t * 0.8) * 0.12;
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Platform Deck: Hexagonal Cylinder */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 4.4, 0.4, 6]} />
        <meshStandardMaterial
          color={isLight ? '#E2E8F0' : '#0B132B'}
          roughness={isLight ? 0.2 : 0.4}
          metalness={isLight ? 0.3 : 0.8}
        />
      </mesh>

      {/* Outer Glowing Perimeter Ring */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[5.25, 5.25, 0.05, 6]} />
        <meshBasicMaterial
          color={isLight ? '#0284C7' : '#39DFFF'}
          wireframe
          transparent
          opacity={isLight ? 0.7 : 0.6}
        />
      </mesh>

      {/* Inner Stepped Deck */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 0.2, 6]} />
        <meshStandardMaterial
          color={isLight ? '#FFFFFF' : '#10182B'}
          roughness={isLight ? 0.3 : 0.5}
          metalness={isLight ? 0.2 : 0.7}
        />
      </mesh>

      {/* Hexagonal Surface Circuit Inlay */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3.8, 6]} />
        <meshBasicMaterial
          color={isLight ? '#7C3AED' : '#9B7BFF'}
          wireframe
          transparent
          opacity={isLight ? 0.5 : 0.35}
        />
      </mesh>

      {/* Cyber Pylons (3 stabilizing floating monoliths around the platform) */}
      {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => {
        const x = Math.cos(angle) * 5.8;
        const z = Math.sin(angle) * 5.8;
        return (
          <group key={idx} position={[x, -0.4, z]}>
            <mesh>
              <boxGeometry args={[0.25, 1.6, 0.25]} />
              <meshStandardMaterial
                color={isLight ? '#CBD5E1' : '#111D3A'}
                roughness={0.3}
                metalness={isLight ? 0.4 : 0.9}
              />
            </mesh>
            {/* Glowing Accent Light */}
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={isLight ? '#0284C7' : '#39DFFF'} />
            </mesh>
          </group>
        );
      })}

      {/* Platform Under-glow Light */}
      <pointLight
        position={[0, -1, 0]}
        color={isLight ? '#0284C7' : '#39DFFF'}
        intensity={isLight ? 2.0 : 2.5}
        distance={8}
      />
    </group>
  );
};
