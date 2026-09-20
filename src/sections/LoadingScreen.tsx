import React, { useState, useEffect } from 'react';
import { portfolioConfig } from '../data/portfolioConfig';

interface LoadingScreenProps {
  onComplete: () => void;
}

const STAGES = [
  'BOOTING SYSTEM KERNEL...',
  'LOADING 3D ENVIRONMENT...',
  'INITIALIZING ORBITAL RIG...',
  'WELCOME TO YASH.OS',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Fast, crisp cinematic loader (under 1.5 seconds)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsFading(true), 150);
          setTimeout(() => onComplete(), 550);
          return 100;
        }

        const next = prev + 5;
        if (next > 75) setStageIndex(3);
        else if (next > 45) setStageIndex(2);
        else if (next > 20) setStageIndex(1);
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => onComplete(), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg-main)] transition-opacity duration-500 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* Center OS Console */}
      <div className="w-full max-w-sm px-6 text-center z-10">
        {/* Monogram Logo */}
        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent-cyan)]/50 flex items-center justify-center text-[var(--accent-cyan)] font-mono font-black text-2xl shadow-[0_0_25px_rgba(57,223,255,0.4)]">
          Y
        </div>

        {/* Title & Callsign */}
        <h1 className="text-xl font-bold font-mono tracking-widest text-[var(--text-primary)] mb-1">
          {portfolioConfig.callsign}
        </h1>
        <p className="text-xs font-mono text-[var(--text-secondary)] tracking-wider mb-6">
          INITIALIZING DEVELOPER ENVIRONMENT
        </p>

        {/* Cyber Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden mb-3 relative">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-violet)] transition-all duration-75 shadow-[0_0_10px_var(--accent-cyan)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Message & Percentage */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[var(--accent-cyan)] animate-pulse">{STAGES[stageIndex]}</span>
          <span className="text-[var(--text-secondary)]">{progress}%</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          onClick={handleSkip}
          className="mt-8 px-3 py-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/40 rounded border border-[var(--border-color)] transition-colors cursor-pointer"
        >
          [SKIP BOOT]
        </button>
      </div>
    </div>
  );
};
