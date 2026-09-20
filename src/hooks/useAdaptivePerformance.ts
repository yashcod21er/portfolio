import { useState, useEffect, useRef } from 'react';
import type { QualityTier } from '../types/portfolio';

export interface PerformanceSettings {
  tier: QualityTier;
  effectiveTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';
  setTier: (tier: QualityTier) => void;
  fps: number;
  dpr: number;
  particleCount: number;
  enableRings: boolean;
  enableBloom: boolean;
}

export function useAdaptivePerformance(): PerformanceSettings {
  const [tier, setTierState] = useState<QualityTier>('AUTO');
  
  const [effectiveTier, setEffectiveTier] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'OFF'>(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isLowConcurrency = (navigator.hardwareConcurrency || 4) <= 2;
      return isMobile || isLowConcurrency ? 'MEDIUM' : 'HIGH';
    }
    return 'HIGH';
  });

  const [fps, setFps] = useState<number>(60);

  // FPS tracking refs
  const frameCount = useRef(0);
  const lastTime = useRef(0);
  const lowFpsCount = useRef(0);

  const setTier = (newTier: QualityTier) => {
    setTierState(newTier);
    if (newTier !== 'AUTO') {
      setEffectiveTier(newTier as 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF');
    } else if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const isLowConcurrency = (navigator.hardwareConcurrency || 4) <= 2;
      setEffectiveTier(isMobile || isLowConcurrency ? 'MEDIUM' : 'HIGH');
    }
  };

  // Real-time FPS monitoring loop
  useEffect(() => {
    let animId: number;

    const measureFps = (now: number) => {
      if (lastTime.current === 0) {
        lastTime.current = now;
      }
      frameCount.current++;
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;

        // Auto performance degradation if dropping below 32 FPS consistently
        if (tier === 'AUTO') {
          if (currentFps < 32) {
            lowFpsCount.current++;
            if (lowFpsCount.current >= 3) {
              setEffectiveTier((prev) => {
                if (prev === 'HIGH') return 'MEDIUM';
                if (prev === 'MEDIUM') return 'LOW';
                return prev;
              });
              lowFpsCount.current = 0;
            }
          } else {
            lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
          }
        }
      }

      animId = requestAnimationFrame(measureFps);
    };

    animId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animId);
  }, [tier]);

  // Derived graphics values
  const dpr = effectiveTier === 'HIGH' ? 1.5 : effectiveTier === 'MEDIUM' ? 1.2 : 1;
  const particleCount = effectiveTier === 'HIGH' ? 350 : effectiveTier === 'MEDIUM' ? 150 : 50;
  const enableRings = effectiveTier !== 'OFF';
  const enableBloom = effectiveTier === 'HIGH';

  return {
    tier,
    effectiveTier,
    setTier,
    fps,
    dpr,
    particleCount,
    enableRings,
    enableBloom,
  };
}
