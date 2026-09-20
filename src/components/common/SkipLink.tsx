import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#39DFFF] text-[#080B16] font-mono text-xs font-bold rounded shadow-lg transition-transform"
    >
      SKIP TO CONTENT
    </a>
  );
};
