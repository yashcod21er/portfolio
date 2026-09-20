import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSystem } from '../context/SystemContext';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { WebGLFallback } from '../components/common/WebGLFallback';
import { SpaceEnvironment } from './SpaceEnvironment';
import { FloatingIsland } from './FloatingIsland';
import { CyberWorkstation } from './CyberWorkstation';
import { EnergyCore } from './EnergyCore';
import { SkillsOrbitalRings } from './SkillsOrbitalRings';
import { HologramPortal } from './HologramPortal';
import { CameraRig } from './CameraRig';

export const SceneContainer: React.FC = () => {
  const { effectiveTier, dpr, theme } = useSystem();
  const { isSupported } = useWebGLSupport();

  // If WebGL is unavailable or user selected 'OFF', render 2D vector fallback
  if (!isSupported || effectiveTier === 'OFF') {
    return <WebGLFallback />;
  }

  const isLight = theme === 'light';
  const cyanColor = isLight ? '#0284C7' : '#39DFFF';
  const violetColor = isLight ? '#7C3AED' : '#9B7BFF';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <ErrorBoundary fallback={<WebGLFallback />} componentName="3D Scene Engine">
        <Suspense fallback={null}>
          <Canvas
            dpr={dpr}
            camera={{ position: [0, 1.2, 5.5], fov: 45 }}
            gl={{
              antialias: effectiveTier === 'HIGH',
              powerPreference: 'high-performance',
              alpha: true,
            }}
            className="w-full h-full pointer-events-auto"
          >
            {/* Ambient & Directional Cyber Lighting adapted to Theme */}
            <ambientLight intensity={isLight ? 0.85 : 0.4} />

            {/* Cyan primary directional key light */}
            <directionalLight
              position={[5, 8, 5]}
              intensity={isLight ? 1.4 : 1.2}
              color={cyanColor}
            />

            {/* Violet rim/fill directional light */}
            <directionalLight
              position={[-5, 4, -4]}
              intensity={isLight ? 1.1 : 0.9}
              color={violetColor}
            />

            {/* Daylight overhead fill for light theme */}
            {isLight && (
              <directionalLight
                position={[0, 10, 0]}
                intensity={0.6}
                color="#FFFFFF"
              />
            )}

            {/* Under-glow for island levitation */}
            <pointLight position={[0, -2, 0]} color={cyanColor} intensity={2} distance={10} />

            {/* Camera Choreography */}
            <CameraRig />

            {/* Cosmos and Atmosphere */}
            <SpaceEnvironment />

            {/* Main Cybernetic Island */}
            <FloatingIsland />

            {/* Developer Workstation */}
            <CyberWorkstation />

            {/* Energy Core & Orbital Skill Rings */}
            <EnergyCore />
            <SkillsOrbitalRings />

            {/* Contact Quantum Gateway */}
            <HologramPortal />
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
