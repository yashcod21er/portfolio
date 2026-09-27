import React from 'react';

export const WebGLFallback: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F6F5F0]">
      {/* Subtle architectural radial tone */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] bg-[#2563EB]/5 pointer-events-none" />

      {/* Editorial Vector Workstation Illustration */}
      <div className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[520px] h-[520px] max-w-[85vw] max-h-[85vw] opacity-75">
        <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
          {/* Architectural Ground Shadow */}
          <ellipse cx="250" cy="380" rx="180" ry="24" fill="#E5E3DC" opacity="0.8" />

          {/* Desk Base & Surface */}
          <path d="M 100 340 L 400 340 L 370 380 L 70 380 Z" fill="#FFFFFF" stroke="#DAD8D1" strokeWidth="2" />
          <path d="M 70 380 L 70 392 L 370 392 L 370 380 Z" fill="#EFEDE7" stroke="#DAD8D1" strokeWidth="2" />

          {/* Desk Mat */}
          <path d="M 140 348 L 360 348 L 340 374 L 120 374 Z" fill="#F1EFEA" stroke="#DAD8D1" strokeWidth="1.5" />

          {/* Studio Monitor Stand & Base */}
          <ellipse cx="250" cy="336" rx="35" ry="8" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="246" y="270" width="8" height="66" fill="#CBD5E1" />

          {/* Studio Monitor Bezel */}
          <rect x="150" y="160" width="200" height="120" rx="8" fill="#111318" stroke="#DAD8D1" strokeWidth="2" />
          {/* Screen */}
          <rect x="156" y="166" width="188" height="108" rx="4" fill="#0F1117" />
          {/* Top Bar */}
          <circle cx="166" cy="174" r="2.5" fill="#EF4444" />
          <circle cx="174" cy="174" r="2.5" fill="#F59E0B" />
          <circle cx="182" cy="174" r="2.5" fill="#10B981" />
          <text x="194" y="176" fill="#94A3B8" fontSize="6" fontFamily="monospace">YASH.DEV</text>
          {/* Screen Code Lines */}
          <text x="166" y="196" fill="#38BDF8" fontSize="7" fontFamily="monospace">&gt; npm run dev</text>
          <text x="166" y="210" fill="#22C55E" fontSize="6" fontFamily="monospace">➜ Local: http://localhost:5173/</text>
          <text x="166" y="224" fill="#E2E8F0" fontSize="6" fontFamily="monospace">&gt; YASH — DIGITAL STUDIO</text>
          <text x="166" y="238" fill="#64748B" fontSize="6" fontFamily="monospace">&gt; building something useful...</text>
          <rect x="166" y="246" width="30" height="1.5" fill="#2563EB" />

          {/* Keyboard */}
          <path d="M 180 355 L 290 355 L 284 370 L 174 370 Z" fill="#FFFFFF" stroke="#DAD8D1" strokeWidth="1.5" />
          <line x1="210" y1="366" x2="250" y2="366" stroke="#2563EB" strokeWidth="2" />

          {/* Mouse */}
          <ellipse cx="315" cy="362" rx="7" ry="10" fill="#FFFFFF" stroke="#DAD8D1" strokeWidth="1.5" />

          {/* Coffee Mug */}
          <rect x="330" y="325" width="16" height="20" rx="3" fill="#FFFFFF" stroke="#DAD8D1" strokeWidth="1.5" />
          <ellipse cx="338" cy="325" rx="8" ry="2.5" fill="#E2E8F0" stroke="#DAD8D1" strokeWidth="1" />
          <path d="M 346 329 C 352 329, 352 341, 346 341" fill="none" stroke="#DAD8D1" strokeWidth="1.5" />

          {/* Desk Plant */}
          <rect x="120" y="325" width="16" height="18" rx="2" fill="#FFFFFF" stroke="#DAD8D1" strokeWidth="1.5" />
          <ellipse cx="128" cy="324" rx="8" ry="3" fill="#4B382A" />
          <path d="M 128 322 C 124 312, 118 310, 116 312 C 120 318, 126 322, 128 322 Z" fill="#16A34A" />
          <path d="M 128 322 C 132 312, 138 310, 140 312 C 136 318, 130 322, 128 322 Z" fill="#22C55E" />
          <path d="M 128 322 C 128 308, 132 306, 128 304 C 124 308, 126 318, 128 322 Z" fill="#15803D" />
        </svg>
      </div>

      {/* Architectural Telemetry Badge on bottom left */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DAD8D1] shadow-studio">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        <span className="text-[10px] font-mono text-[#64748B] tracking-widest uppercase">
          ARCHITECTURAL 2D VECTOR MODE ACTIVE
        </span>
      </div>
    </div>
  );
};
