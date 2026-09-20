import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const SkillsOrbitalRings: React.FC = () => {
  const { enableRings } = useSystem();
  const ringGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += delta * 0.15;
    }
  });

  if (!enableRings) return null;

  const orbitalNodes = [
    { radius: 2.2, color: '#39DFFF', size: 0.1, y: 0.2 },
    { radius: 2.8, color: '#9B7BFF', size: 0.12, y: -0.1 },
    { radius: 3.4, color: '#38BDF8', size: 0.09, y: 0.15 },
    { radius: 4.0, color: '#A855F7', size: 0.11, y: -0.2 },
  ];

  return (
    <group ref={ringGroupRef} position={[0, 1.8, -1.2]} rotation={[0.3, 0, 0.1]}>
      {orbitalNodes.map((orb, i) => (
        <group key={i}>
          {/* Orbital Path Line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[orb.radius - 0.015, orb.radius + 0.015, 64]} />
            <meshBasicMaterial
              color={orb.color}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Planetary Node */}
          <mesh position={[orb.radius * Math.cos((i * Math.PI) / 2), orb.y, orb.radius * Math.sin((i * Math.PI) / 2)]}>
            <sphereGeometry args={[orb.size, 16, 16]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
