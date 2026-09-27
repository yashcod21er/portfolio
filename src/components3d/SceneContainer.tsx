import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { WebGLFallback } from '../components/common/WebGLFallback';
import { StudioEnvironment } from './StudioEnvironment';
import { Workstation } from './Workstation';
import { TechnicalCore } from './TechnicalCore';
import { ContactPortal } from './ContactPortal';
import { CameraRig } from './CameraRig';

export const SceneContainer: React.FC = () => {
  const { effectiveTier, dpr, activeSection } = useSystem();
  const { isSupported } = useWebGLSupport();
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If WebGL is unavailable or user selected 'OFF', render 2D vector fallback
  if (!isSupported || effectiveTier === 'OFF') {
    return <WebGLFallback />;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <ErrorBoundary fallback={<WebGLFallback />} componentName="3D Studio Engine">
        <Suspense fallback={null}>
          <Canvas
            dpr={dpr}
            shadows={effectiveTier === 'HIGH' ? { type: THREE.PCFShadowMap } : false}
            camera={{ position: [1.8, 1.8, 4.4], fov: 45 }}
            gl={{
              antialias: effectiveTier === 'HIGH',
              powerPreference: 'high-performance',
              alpha: true,
            }}
            className="w-full h-full pointer-events-none"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Camera Movement Choreography */}
            <CameraRig />

            {/* Studio Environment & Daylight Lighting */}
            <StudioEnvironment />

            {/* Main Procedural Developer Workstation */}
            <Workstation />

            {/* Section-Activated 3D Focal Elements (Desktop & Tablet) */}
            {!isMobile && activeSection === 'skills' && <TechnicalCore />}
            {!isMobile && activeSection === 'contact' && <ContactPortal />}
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
