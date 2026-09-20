import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const EnergyCore: React.FC = () => {
  const { scrollToSection, triggerSound, theme } = useSystem();
  const [hovered, setHovered] = useState(false);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const isLight = theme === 'light';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.8;
      coreRef.current.rotation.x = t * 0.4;
      const pulse = 1 + Math.sin(t * 2.5) * 0.08;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.6;
      ring1Ref.current.rotation.y = t * 0.3;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.5;
      ring2Ref.current.rotation.x = -t * 0.4;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    triggerSound('click');
    scrollToSection('skills');
  };

  const cyanColor = isLight ? '#0284C7' : '#39DFFF';
  const violetColor = isLight ? '#7C3AED' : '#9B7BFF';

  return (
    <group
      position={[0, 1.8, -1.2]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        triggerSound('hover');
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central Pulsing Crystalline Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color={cyanColor}
          emissive={cyanColor}
          emissiveIntensity={hovered ? 1.4 : isLight ? 0.9 : 0.6}
          wireframe={!hovered}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Glowing Point Light */}
      <pointLight color={cyanColor} intensity={hovered ? 3 : 2.0} distance={6} />

      {/* Inner Torus Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.9, 0.02, 16, 64]} />
        <meshBasicMaterial color={violetColor} transparent opacity={isLight ? 0.8 : 0.7} />
      </mesh>

      {/* Outer Torus Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.2, 0.025, 16, 64]} />
        <meshBasicMaterial color={cyanColor} transparent opacity={isLight ? 0.7 : 0.5} />
      </mesh>

      {/* Interactive Tooltip on Hover */}
      {hovered && (
        <Html position={[0, 1.1, 0]} center distanceFactor={10} pointerEvents="none">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-violet)] shadow-lg backdrop-blur-md text-center whitespace-nowrap">
            <div className="text-[10px] font-mono text-[var(--accent-violet)] font-bold tracking-widest uppercase">
              ENERGY CORE // SKILLS
            </div>
            <div className="text-[9px] font-sans text-[var(--text-primary)]">Click to view technology matrix</div>
          </div>
        </Html>
      )}
    </group>
  );
};
