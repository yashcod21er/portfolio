import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';
import type { SectionId } from '../types/portfolio';

export const CameraRig: React.FC = () => {
  const { activeSection, reducedMotion } = useSystem();
  const { camera, size } = useThree();

  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;
  const shiftX = isMobile ? 0 : isTablet ? 0.45 : 0.85;

  const mouse = useRef({ x: 0, y: 0 });
  const currentTarget = useRef(new THREE.Vector3(0, 0.3, 0));

  useEffect(() => {
    // Only listen to mouse movements on fine-pointer devices
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Gentle normalized mouse offsets (-1 to 1)
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    // Dynamic architectural studio viewpoints adapting to device form-factor and workstation shift
    type ViewConfig = { pos: [number, number, number]; lookAt: [number, number, number] };
    
    let configs: Record<SectionId, ViewConfig>;

    if (isMobile) {
      // Portrait smartphone framing: workstation centered, camera pulled back to fit within narrow aspect ratio
      configs = {
        home: {
          pos: [0.0, 0.48, 5.0],
          lookAt: [0.0, 0.28, 0],
        },
        about: {
          pos: [0.0, 0.85, 4.6],
          lookAt: [0.0, 0.15, 0],
        },
        skills: {
          pos: [0.0, 1.4, 4.8],
          lookAt: [0.0, 0.35, -0.1],
        },
        projects: {
          pos: [0.0, 0.7, 3.8],
          lookAt: [0.0, 0.25, -0.1],
        },
        journey: {
          pos: [0.0, 1.3, 5.0],
          lookAt: [0.0, 0.35, -0.3],
        },
        contact: {
          pos: [0.0, 1.25, 4.4],
          lookAt: [0.0, 0.55, -0.3],
        },
      };
    } else if (isTablet) {
      // Tablet portrait / square framing: moderate shift & balanced camera distance
      configs = {
        home: {
          pos: [0.9, 0.85, 4.4],
          lookAt: [0.25, -0.05, 0],
        },
        about: {
          pos: [1.1, 1.0, 3.6],
          lookAt: [0.35, 0.1, 0],
        },
        skills: {
          pos: [-0.9, 1.5, 4.4],
          lookAt: [-0.1, 0.5, -0.2],
        },
        projects: {
          pos: [0.35, 0.65, 2.9],
          lookAt: [0.35, 0.22, -0.15],
        },
        journey: {
          pos: [1.6, 1.5, 4.6],
          lookAt: [0.4, 0.38, -0.3],
        },
        contact: {
          pos: [0.0, 1.25, 3.8],
          lookAt: [0.0, 0.6, -0.3],
        },
      };
    } else {
      // Desktop widescreen framing: right-shifted workstation for editorial left-column typography
      configs = {
        home: {
          pos: [1.65, 0.85, 3.85],
          lookAt: [-0.02, -0.08, 0],
        },
        about: {
          pos: [1.4 + shiftX * 0.7, 1.1, 3.2],
          lookAt: [0.15 + shiftX, 0.1, 0],
        },
        skills: {
          pos: [-1.4, 1.5, 4.2],
          lookAt: [-0.2, 0.6, -0.2],
        },
        projects: {
          pos: [-0.05 + shiftX, 0.65, 2.45],
          lookAt: [-0.05 + shiftX, 0.22, -0.15],
        },
        journey: {
          pos: [2.2 + shiftX * 0.6, 1.6, 4.4],
          lookAt: [0.6 + shiftX, 0.4, -0.4],
        },
        contact: {
          pos: [0, 1.25, 3.4],
          lookAt: [0, 0.65, -0.4],
        },
      };
    }

    const targetConfig = configs[activeSection] || configs.home;

    // Subtle, comfortable mouse parallax (disabled on mobile or reduced-motion)
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const parallaxFactor = reducedMotion || isTouch ? 0 : 0.18;
    const parallaxX = mouse.current.x * parallaxFactor;
    const parallaxY = mouse.current.y * (parallaxFactor * 0.6);

    const targetPos = new THREE.Vector3(
      targetConfig.pos[0] + parallaxX,
      targetConfig.pos[1] + parallaxY,
      targetConfig.pos[2]
    );

    const targetLookAt = new THREE.Vector3(
      targetConfig.lookAt[0] + parallaxX * 0.08,
      targetConfig.lookAt[1] + parallaxY * 0.08,
      targetConfig.lookAt[2]
    );

    // Smooth delta-timed lerp damping
    const lerpSpeed = Math.min(delta * 2.4, 0.1);
    camera.position.lerp(targetPos, lerpSpeed);
    currentTarget.current.lerp(targetLookAt, lerpSpeed);
    camera.lookAt(currentTarget.current);
  });

  return null;
};
