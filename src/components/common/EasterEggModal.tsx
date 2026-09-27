import React, { useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Trophy, Sparkles, X, Heart } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
}

export const EasterEggModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { triggerSound } = useSystem();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerSound('victory');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#2563EB', '#38BDF8', '#10B981', '#F59E0B', '#7C3AED', '#EC4899'];
    const particles: Particle[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, triggerSound]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111318]/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] p-6 sm:p-8 shadow-2xl text-center space-y-4"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#2563EB] shadow-sm">
          <Trophy className="w-7 h-7 animate-bounce" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Konami Secret Unlocked
          </div>
          <h2 className="text-2xl font-black font-display text-[#111318] tracking-tight">
            You Found The Easter Egg!
          </h2>
          <p className="text-xs sm:text-sm text-[#646873] mt-2 leading-relaxed">
            Respect from a fellow developer. Yash Hogade welcomes you to YASH · DIGITAL STUDIO. You have unlocked developer telemetry &amp; full access.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1] text-left text-xs font-mono text-[#646873] space-y-1">
          <div className="text-[#111318] font-bold flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-[#EF4444] fill-[#EF4444]" /> Engineer Stats:
          </div>
          <div>• Savitribai Phule Pune University (SPPU)</div>
          <div>• AISSMS College of Engineering, Pune</div>
          <div>• React 19 · Node.js · Three.js · C++ · TypeScript</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          CONTINUE EXPLORING ↗
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#646873] hover:text-[#111318] hover:bg-[#F6F5F0] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
