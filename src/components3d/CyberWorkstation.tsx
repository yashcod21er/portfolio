import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

export const CyberWorkstation: React.FC = () => {
  const { scrollToSection, triggerSound, theme } = useSystem();
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const isLight = theme === 'light';

  // Generate procedural canvas texture for the workstation screen
  const screenTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    ctx.fillStyle = isLight ? '#0B1329' : '#080B16';
    ctx.fillRect(0, 0, 512, 256);

    // Grid lines
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(57, 223, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Code lines simulation
    ctx.fillStyle = isLight ? '#38BDF8' : '#39DFFF';
    ctx.font = 'bold 13px Courier, monospace';
    ctx.fillText('// YASH.OS WORKSTATION BOOT', 24, 36);
    ctx.fillStyle = '#10B981';
    ctx.fillText('> import { FullStackDev } from "@aissms/coe";', 24, 60);
    ctx.fillText('> const yash = new FullStackDev({ degree: "BE" });', 24, 82);
    ctx.fillStyle = isLight ? '#C084FC' : '#9B7BFF';
    ctx.fillText('> yash.compileProjects(["Airbnb", "Spotify", "RecipeHub"]);', 24, 104);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('/* Architecture: Node.js, Express, React, Three.js */', 24, 130);
    ctx.fillStyle = isLight ? '#38BDF8' : '#39DFFF';
    ctx.fillText('SYSTEM_STATE: OPERATIONAL [READY TO EXPLORE]', 24, 156);

    // Glowing status rectangle
    ctx.strokeStyle = isLight ? '#38BDF8' : '#39DFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 180, 472, 50);
    ctx.fillStyle = isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(57, 223, 255, 0.15)';
    ctx.fillRect(20, 180, 472, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CLICK TO ENTER PROJECT ARCHIVES', 110, 210);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [isLight]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      // Gentle responsive levitation
      groupRef.current.position.y = -0.8 + Math.sin(t * 1.2) * 0.05;
      if (hovered) {
        groupRef.current.scale.lerp(new THREE.Vector3(1.04, 1.04, 1.04), 0.1);
      } else {
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    triggerSound('click');
    scrollToSection('projects');
  };

  return (
    <group
      ref={groupRef}
      position={[0, -0.8, 0.5]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        triggerSound('hover');
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Desk Base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.08, 1.4]} />
        <meshStandardMaterial
          color={isLight ? '#FFFFFF' : '#0B132B'}
          metalness={isLight ? 0.3 : 0.8}
          roughness={isLight ? 0.2 : 0.3}
        />
      </mesh>

      {/* Desk Bevel Neon Glow Edge */}
      <mesh position={[0, 0.045, 0.69]}>
        <boxGeometry args={[3.2, 0.02, 0.02]} />
        <meshBasicMaterial color={isLight ? '#0284C7' : '#39DFFF'} />
      </mesh>

      {/* Desk Legs / Pedestals */}
      <mesh position={[-1.4, -0.4, 0]}>
        <boxGeometry args={[0.15, 0.8, 1.2]} />
        <meshStandardMaterial color={isLight ? '#E2E8F0' : '#10182B'} metalness={isLight ? 0.2 : 0.9} roughness={0.4} />
      </mesh>
      <mesh position={[1.4, -0.4, 0]}>
        <boxGeometry args={[0.15, 0.8, 1.2]} />
        <meshStandardMaterial color={isLight ? '#E2E8F0' : '#10182B'} metalness={isLight ? 0.2 : 0.9} roughness={0.4} />
      </mesh>

      {/* Monitor Stand */}
      <mesh position={[0, 0.25, -0.3]}>
        <cylinderGeometry args={[0.04, 0.05, 0.5, 16]} />
        <meshStandardMaterial color={isLight ? '#CBD5E1' : '#1E293B'} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Curved Ultrawide Main Monitor Frame */}
      <mesh position={[0, 0.7, -0.3]}>
        <boxGeometry args={[2.4, 1.1, 0.06]} />
        <meshStandardMaterial
          color={isLight ? '#1E293B' : '#050811'}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Main Monitor Display Surface with Terminal Texture */}
      {screenTexture && (
        <mesh position={[0, 0.7, -0.26]}>
          <planeGeometry args={[2.3, 1.0]} />
          <meshBasicMaterial
            map={screenTexture}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Holographic Left Pane */}
      <group position={[-1.45, 0.7, -0.1]} rotation={[0, 0.35, 0]}>
        <mesh>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color={isLight ? '#0284C7' : '#39DFFF'}
            transparent
            opacity={0.35}
            roughness={0.2}
            metalness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <planeGeometry args={[0.7, 0.9]} />
          <meshBasicMaterial color={isLight ? '#0284C7' : '#39DFFF'} wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Holographic Right Pane */}
      <group position={[1.45, 0.7, -0.1]} rotation={[0, -0.35, 0]}>
        <mesh>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color={isLight ? '#7C3AED' : '#9B7BFF'}
            transparent
            opacity={0.35}
            roughness={0.2}
            metalness={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <planeGeometry args={[0.7, 0.9]} />
          <meshBasicMaterial color={isLight ? '#7C3AED' : '#9B7BFF'} wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Keyboard & Trackpad */}
      <mesh position={[0, 0.05, 0.25]}>
        <boxGeometry args={[1.0, 0.02, 0.35]} />
        <meshStandardMaterial color={isLight ? '#F1F5F9' : '#111D3A'} roughness={0.6} />
      </mesh>

      {/* Interactive Tooltip on Hover */}
      {hovered && (
        <Html position={[0, 1.5, -0.3]} center distanceFactor={10} pointerEvents="none">
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-cyan)] shadow-lg backdrop-blur-md text-center whitespace-nowrap">
            <div className="text-[10px] font-mono text-[var(--accent-cyan)] font-bold tracking-widest uppercase">
              WORKSTATION // PROJECTS
            </div>
            <div className="text-[9px] font-sans text-[var(--text-primary)]">Click to view project archives</div>
          </div>
        </Html>
      )}
    </group>
  );
};
