import React, { useRef, useState } from 'react';
import { portfolioConfig } from '../../data/portfolioConfig';
import { useSystem } from '../../context/SystemContext';
import { GraduationCap, ShieldCheck, Sparkles, Cpu, Award } from 'lucide-react';

export const HolographicIdCard: React.FC = () => {
  const { triggerSound } = useSystem();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(hover: none)').matches);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const degX = ((y - centerY) / centerY) * -14;
    const degY = ((x - centerX) / centerX) * 14;

    setRotX(degX);
    setRotY(degY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    setIsHovered(true);
    triggerSound('hover');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <div
      className="perspective-1000 w-full max-w-sm mx-auto"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        style={{
          transform: isHovered
            ? `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
        }}
        className="relative rounded-3xl bg-gradient-to-br from-[#FFFFFF] to-[#F1F5F9] border-2 border-[#DAD8D1] shadow-2xl p-6 overflow-hidden select-none cursor-pointer transform-gpu"
      >
        {/* Holographic Rainbow Foil Sheen Layer */}
        <div
          style={{
            background: isHovered
              ? `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.85) 0%, rgba(56, 189, 248, 0.3) 30%, rgba(168, 85, 247, 0.25) 55%, transparent 75%)`
              : 'none',
          }}
          className="absolute inset-0 pointer-events-none mix-blend-overlay z-20 transition-opacity duration-300"
        />

        {/* Lanyard Clip Slot */}
        <div className="w-12 h-2.5 mx-auto -mt-2 mb-4 rounded-full bg-[#E2E8F0] border border-[#CBD5E1]" />

        {/* Header Institution Credentials */}
        <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-display font-black text-xs shadow-sm">
              YH
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-[#111318] tracking-wider uppercase leading-tight">
                {portfolioConfig.education.college}
              </div>
              <div className="text-[9px] font-mono text-[#646873]">
                {portfolioConfig.education.university}
              </div>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
        </div>

        {/* Badge Profile Section */}
        <div className="flex items-center gap-4 mb-5">
          {/* Avatar / Monogram Shield */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E293B] to-[#334155] border-2 border-[#2563EB] flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-8 h-8 text-[#38BDF8]" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white" />
          </div>

          <div>
            <div className="text-base font-black font-display text-[#111318] tracking-tight">
              {portfolioConfig.name}
            </div>
            <div className="text-xs font-mono font-semibold text-[#2563EB]">
              {portfolioConfig.role}
            </div>
            <div className="text-[10px] font-mono text-[#646873] mt-0.5">
              {portfolioConfig.education.degree}
            </div>
          </div>
        </div>

        {/* Key Credentials Badges */}
        <div className="grid grid-cols-2 gap-2 text-left mb-4">
          <div className="p-2.5 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1]/80">
            <div className="text-[9px] font-mono text-[#8E929D] uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#2563EB]" /> STATUS
            </div>
            <div className="text-xs font-mono font-bold text-[#111318]">
              {portfolioConfig.education.status}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1]/80">
            <div className="text-[9px] font-mono text-[#8E929D] uppercase flex items-center gap-1">
              <Award className="w-3 h-3 text-[#10B981]" /> LOCATION
            </div>
            <div className="text-xs font-mono font-bold text-[#111318]">
              Pune, MH, India
            </div>
          </div>
        </div>

        {/* Verified Security Hologram Foil Seal */}
        <div className="flex items-center justify-between pt-3 border-t border-[#DAD8D1]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#2563EB]">
              <Sparkles className="w-3 h-3" /> VERIFIED CREDENTIALS
            </div>
            {/* Barcode representation */}
            <div className="flex items-center gap-0.5 h-3 opacity-60">
              {[2, 4, 1, 3, 2, 5, 2, 1, 4, 3, 2, 4, 1, 3, 2, 4, 2].map((w, i) => (
                <span key={i} className="bg-[#111318] h-full" style={{ width: `${w}px` }} />
              ))}
            </div>
          </div>

          <div className="text-[9px] font-mono text-[#8E929D] text-right">
            ID: ENG-2022-26<br />SPPU-VALIDATED
          </div>
        </div>
      </div>
    </div>
  );
};
