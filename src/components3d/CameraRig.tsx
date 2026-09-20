import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';
import type { SectionId } from '../types/portfolio';

// Distinct cinematic camera targets and viewpoints for each section
const CAMERA_CONFIGS: Record<SectionId, { pos: [number, number, number]; lookAt: [number, number, number] }> = {
  home: {
    pos: [0, 1.2, 5.5],
    lookAt: [0, 0.4, 0],
  },
  about: {
    pos: [0, 0.8, 3.8],
    lookAt: [0, 0.2, 0],
  },
  skills: {
    pos: [0, 2.2, 4.2],
    lookAt: [0, 1.8, -1.2],
  },
  projects: {
    pos: [-1.4, 0.7, 3.8],
    lookAt: [0, 0.3, 0],
  },
  journey: {
    pos: [1.5, 1.4, 4.5],
    lookAt: [0, 0.8, -1.0],
  },
  contact: {
    pos: [0, 1.0, 3.2],
    lookAt: [0, 0.5, -5.5],
  },
};

export const CameraRig: React.FC = () => {
  const { activeSection } = useSystem();
  const { camera } = useThree();

  const mouse = useRef({ x: 0, y: 0 });
  const currentTarget = useRef(new THREE.Vector3(0, 0.4, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Gentle normalized mouse offsets (-1 to 1)
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    const targetConfig = CAMERA_CONFIGS[activeSection] || CAMERA_CONFIGS.home;

    // Add subtle, comfortable mouse parallax (clamped)
    const parallaxX = mouse.current.x * 0.25;
    const parallaxY = mouse.current.y * 0.15;

    const targetPos = new THREE.Vector3(
      targetConfig.pos[0] + parallaxX,
      targetConfig.pos[1] + parallaxY,
      targetConfig.pos[2]
    );

    const targetLookAt = new THREE.Vector3(
      targetConfig.lookAt[0] + parallaxX * 0.1,
      targetConfig.lookAt[1] + parallaxY * 0.1,
      targetConfig.lookAt[2]
    );

    // Smooth delta-timed lerp damping
    const lerpSpeed = Math.min(delta * 2.2, 0.1);
    camera.position.lerp(targetPos, lerpSpeed);
    currentTarget.current.lerp(targetLookAt, lerpSpeed);
    camera.lookAt(currentTarget.current);
  });

  return null;
};
