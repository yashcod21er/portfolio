import React from 'react';
import { useSystem } from '../../context/SystemContext';

export const WebGLFallback: React.FC = () => {
  const { theme } = useSystem();
  const isLight = theme === 'light';

  const cyanColor = isLight ? '#0284C7' : '#39DFFF';
  const violetColor = isLight ? '#7C3AED' : '#9B7BFF';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[var(--bg-main)] transition-colors duration-300">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid opacity-60" />
      
      {/* Subtle radial ambient glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{ backgroundColor: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(57, 223, 255, 0.05)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: isLight ? 'rgba(124, 58, 237, 0.08)' : 'rgba(155, 123, 255, 0.05)' }}
      />

      {/* Futuristic Vector Workstation / Core representation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] max-w-[90vw] max-h-[90vw] opacity-40">
        <svg viewBox="0 0 500 500" className="w-full h-full animate-spin-slow">
          {/* Outer Orbital Ring */}
          <circle
            cx="250"
            cy="250"
            r="200"
            fill="none"
            stroke={cyanColor}
            strokeWidth="1.5"
            strokeDasharray="8 12"
            strokeOpacity={isLight ? 0.6 : 0.4}
          />
          {/* Mid Ring */}
          <circle
            cx="250"
            cy="250"
            r="150"
            fill="none"
            stroke={violetColor}
            strokeWidth="1.5"
            strokeDasharray="20 40"
            strokeOpacity={isLight ? 0.7 : 0.6}
          />
          {/* Inner Hexagon Core */}
          <polygon
            points="250,170 319,210 319,290 250,330 181,290 181,210"
            fill={isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(57, 223, 255, 0.05)'}
            stroke={cyanColor}
            strokeWidth="2"
          />
          <circle cx="250" cy="250" r="16" fill={cyanColor} opacity={0.8} />
          <circle cx="250" cy="250" r="6" fill={isLight ? '#0F172A' : '#FFFFFF'} />
        </svg>
      </div>

      {/* Status banner on bottom left */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)]/80 border border-[var(--border-color)] backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
        <span className="text-[11px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
          Vector Canvas Engine Active · {theme.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
