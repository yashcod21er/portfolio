import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const ContactPortal: React.FC = () => {
  const { scrollToSection, triggerSound, reducedMotion } = useSystem();
  const portalRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (portalRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      portalRef.current.position.y = 0.95 + Math.sin(t * 0.9) * 0.03;
    }
    if (ringRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      ringRef.current.rotation.z = t * 0.1;
    }
  });

  const handleTrigger = () => {
    triggerSound('click');
    scrollToSection('contact');
    const input = document.getElementById('contact-name');
    if (input) input.focus();
  };

  return (
    <group
      ref={portalRef}
      position={[0, 0.95, -1.8]}
      onClick={(e) => {
        e.stopPropagation();
        handleTrigger();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Minimalist Circular Architectural Doorway Frame */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.95, 0.08, 32, 64]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Hairline Accent Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <ringGeometry args={[1.05, 1.06, 64]} />
        <meshBasicMaterial color="#DAD8D1" />
      </mesh>

      {/* 2. Soft Blue Interior Light Emitter */}
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[0.88, 48]} />
        <meshStandardMaterial
          color="#2563EB"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Soft blue point light radiating outwards */}
      <pointLight position={[0, 0, 0.2]} intensity={0.8} color="#2563EB" distance={3} />

      {/* 3. Central Architectural Floating Text */}
      <Html center distanceFactor={8} style={{ pointerEvents: 'auto' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTrigger();
          }}
          className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-[#DAD8D1] shadow-studio text-xs font-mono font-bold tracking-widest text-[#111318] hover:border-[#2563EB] hover:text-[#2563EB] transition-all cursor-pointer whitespace-nowrap"
        >
          LET'S TALK ↗
        </button>
      </Html>
    </group>
  );
};
