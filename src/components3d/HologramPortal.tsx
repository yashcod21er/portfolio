import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const HologramPortal: React.FC = () => {
  const { scrollToSection, triggerSound, theme } = useSystem();
  const [hovered, setHovered] = useState(false);
  const portalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const isLight = theme === 'light';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (portalRef.current) {
      portalRef.current.rotation.z = t * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.6;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    triggerSound('click');
    scrollToSection('contact');
  };

  const cyanColor = isLight ? '#0284C7' : '#39DFFF';
  const violetColor = isLight ? '#7C3AED' : '#9B7BFF';

  return (
    <group
      position={[0, 0.5, -6]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        triggerSound('hover');
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outer Gateway Structure */}
      <mesh ref={portalRef}>
        <torusGeometry args={[2.0, 0.08, 16, 64]} />
        <meshStandardMaterial
          color={cyanColor}
          emissive={cyanColor}
          emissiveIntensity={hovered ? 1.5 : isLight ? 1.0 : 0.8}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Rotating Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.7, 0.04, 16, 64]} />
        <meshBasicMaterial
          color={violetColor}
          wireframe
          transparent
          opacity={isLight ? 0.7 : 0.6}
        />
      </mesh>

      {/* Center Event Horizon Plane */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[1.65, 32]} />
        <meshBasicMaterial
          color={isLight ? '#E2E8F0' : '#111D3A'}
          transparent
          opacity={isLight ? 0.4 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point Light Glow */}
      <pointLight
        color={cyanColor}
        intensity={hovered ? 4 : 2}
        distance={8}
      />

      {/* Interactive Tooltip on Hover */}
      {hovered && (
        <Html position={[0, 2.4, 0]} center distanceFactor={12} pointerEvents="none">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-cyan)] shadow-lg backdrop-blur-md text-center whitespace-nowrap">
            <div className="text-[10px] font-mono text-[var(--accent-cyan)] font-bold tracking-widest uppercase">
              QUANTUM GATEWAY // CONTACT
            </div>
            <div className="text-[9px] font-sans text-[var(--text-primary)]">Click to send communication</div>
          </div>
        </Html>
      )}
    </group>
  );
};
