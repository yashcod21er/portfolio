import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

interface NodeData {
  id: string;
  name: string;
  category: string;
  color: string;
  position: [number, number, number];
}

export const TechnicalCore: React.FC = () => {
  const { reducedMotion, triggerSound } = useSystem();
  const coreRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  // 5 domain nodes positioned in an elevated architectural arc ABOVE the monitor
  // Local origin (0, 0, 0) corresponds to world space (0, 1.48, -0.25)
  const nodes: NodeData[] = useMemo(
    () => [
      { id: 'frontend', name: 'FRONTEND', category: 'React / Next.js / TS', color: '#2563EB', position: [1.15, 0.12, 0.15] },
      { id: 'backend', name: 'BACKEND', category: 'Node / Express / REST', color: '#4F46E5', position: [-1.15, 0.15, 0.15] },
      { id: 'database', name: 'DATABASE', category: 'MongoDB / MySQL / SQL', color: '#0284C7', position: [0.0, 0.42, -0.15] },
      { id: 'programming', name: 'CORE CS', category: 'C++ / OOP / DSA', color: '#7C3AED', position: [-0.75, -0.16, 0.2] },
      { id: 'tools', name: 'TOOLCHAIN', category: 'Git / VS Code / Postman', color: '#0D9488', position: [0.75, -0.16, 0.2] },
    ],
    []
  );

  // Generate smooth 3D curves from the center (0, 0, 0) to each node
  const lineObjects = useMemo(() => {
    const center = new THREE.Vector3(0, 0, 0);
    return nodes.map((node) => {
      const end = new THREE.Vector3(...node.position);
      const mid = new THREE.Vector3()
        .addVectors(center, end)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, 0.15, 0));
      const curve = new THREE.QuadraticBezierCurve3(center, mid, end);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      const material = new THREE.LineBasicMaterial({ color: '#CBD5E1', transparent: true, opacity: 0.6 });
      return new THREE.Line(geometry, material);
    });
  }, [nodes]);

  // Subtle floating projection animation well above the monitor
  useFrame(({ clock }) => {
    if (coreRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      coreRef.current.rotation.y = t * 0.12;
      coreRef.current.position.y = 1.48 + Math.sin(t * 0.7) * 0.03;
    }
    if (outerRingRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      outerRingRef.current.rotation.z = -t * 0.15;
    }
  });

  return (
    <group ref={coreRef} position={[0, 1.48, -0.25]}>
      {/* 1. Holographic Vertical Beam Line connecting top of monitor to floating core */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.36, 16]} />
        <meshBasicMaterial color="#2563EB" transparent opacity={0.35} />
      </mesh>

      {/* 2. Central White & Cobalt Architectural Core (Scaled to float with zero collision) */}
      <mesh castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Internal Cobalt Core */}
      <mesh>
        <icosahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial
          color="#2563EB"
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* Wireframe Architectural Ring ("Sun" Halo) */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[0.34, 0.355, 32]} />
        <meshBasicMaterial color="#DAD8D1" side={THREE.DoubleSide} />
      </mesh>

      {/* 3. Thin connecting 3D curves */}
      {lineObjects.map((lineObj, idx) => (
        <primitive key={idx} object={lineObj} />
      ))}

      {/* 4. Radial Domain Nodes & Floating Architectural Labels */}
      {nodes.map((node) => (
        <group key={node.id} position={node.position}>
          {/* Physical Node Spherical Anchor */}
          <mesh castShadow>
            <sphereGeometry args={[0.065, 24, 24]} />
            <meshStandardMaterial
              color={node.color}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>

          {/* Concentric Node Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.09, 0.105, 24]} />
            <meshBasicMaterial color={node.color} side={THREE.DoubleSide} />
          </mesh>

          {/* Clean Floating Studio Tag */}
          <Html
            center
            distanceFactor={8}
            style={{ pointerEvents: 'auto' }}
          >
            <div
              onClick={() => triggerSound('click')}
              className="px-2.5 py-1 rounded-md bg-white/95 border border-[#DAD8D1] shadow-studio text-center select-none cursor-pointer hover:border-[#2563EB] transition-colors whitespace-nowrap"
            >
              <div
                className="text-[10px] font-mono font-bold tracking-wider"
                style={{ color: node.color }}
              >
                {node.name}
              </div>
              <div className="text-[9px] font-mono text-[#646873]">
                {node.category}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};
