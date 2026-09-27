import React, { useState, useEffect } from 'react';
import { portfolioConfig } from '../data/portfolioConfig';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Fast, crisp architectural loader (under 1.2s)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsFading(true), 120);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => onComplete(), 150);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F6F5F0] transition-opacity duration-500 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-xs px-6 text-center">
        {/* Minimal YH Monogram */}
        <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-white border border-[#DAD8D1] shadow-studio flex items-center justify-center text-[#111318] font-mono font-bold text-sm tracking-wider">
          YH
        </div>

        {/* Title */}
        <h1 className="text-sm font-mono font-bold tracking-widest text-[#111318] mb-1">
          {portfolioConfig.callsign}
        </h1>
        <p className="text-[11px] font-mono text-[#646873] tracking-wider mb-6">
          DEVELOPER WORKSPACE · 2026
        </p>

        {/* Hairline Progress Bar */}
        <div className="w-full h-[2px] bg-[#E8E6DF] overflow-hidden mb-3">
          <div
            className="h-full bg-[#2563EB] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Numerical Counter */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#646873]">
          <span>LOADING ENVIRONMENT</span>
          <span className="font-bold text-[#111318]">{progress}%</span>
        </div>

        {/* Skip button for instant entry */}
        <button
          onClick={handleSkip}
          className="mt-8 px-3 py-1 text-[11px] font-mono text-[#8E929D] hover:text-[#111318] hover:border-[#111318] rounded border border-[#DAD8D1] transition-colors cursor-pointer"
        >
          [ENTER STUDIO]
        </button>
      </div>
    </div>
  );
};
