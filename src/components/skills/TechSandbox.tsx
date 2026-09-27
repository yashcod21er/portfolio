import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Sparkles, RefreshCw, Zap, Wind, CheckCircle2 } from 'lucide-react';

interface TechItem {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Core CS' | 'Toolchain';
  color: string;
  bg: string;
  experience: string;
  projects: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isDragging?: boolean;
}

const INITIAL_SKILLS: Omit<TechItem, 'x' | 'y' | 'vx' | 'vy' | 'radius'>[] = [
  { id: 'react', name: 'React 19', category: 'Frontend', color: '#2563EB', bg: '#EFF6FF', experience: 'Advanced · 3+ Years', projects: ['Airbnb Clone', 'Spotify Clone', 'NexaAI', 'Zerodha Clone'] },
  { id: 'nextjs', name: 'Next.js', category: 'Frontend', color: '#111318', bg: '#F1F5F9', experience: 'Advanced · 2+ Years', projects: ['Airbnb Clone', 'Portfolio Studio'] },
  { id: 'typescript', name: 'TypeScript', category: 'Frontend', color: '#3178C6', bg: '#EFF6FF', experience: 'Advanced · 3+ Years', projects: ['All Production Repos'] },
  { id: 'nodejs', name: 'Node.js', category: 'Backend', color: '#16A34A', bg: '#F0FDF4', experience: 'Advanced · 3+ Years', projects: ['Airbnb Clone', 'NexaAI API', 'Zerodha Backend'] },
  { id: 'express', name: 'Express.js', category: 'Backend', color: '#334155', bg: '#F8FAFC', experience: 'Proficient · 2+ Years', projects: ['Backend Microservices'] },
  { id: 'threejs', name: 'Three.js / R3F', category: 'Frontend', color: '#7C3AED', bg: '#F5F3FF', experience: 'Intermediate · 1.5 Years', projects: ['3D Portfolio Studio'] },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend', color: '#0284C7', bg: '#F0F9FF', experience: 'Advanced · 3+ Years', projects: ['All Frontends'] },
  { id: 'cpp', name: 'C++ / OOP', category: 'Core CS', color: '#00599C', bg: '#EFF6FF', experience: 'Strong Foundation · Academic Focus', projects: ['SPPU Coursework & DSA'] },
  { id: 'dsa', name: 'Data Structures', category: 'Core CS', color: '#D97706', bg: '#FFFBEB', experience: 'Algorithms & Problem Solving', projects: ['Computer Engineering Curricula'] },
  { id: 'mongodb', name: 'MongoDB', category: 'Database', color: '#15803D', bg: '#F0FDF4', experience: 'Proficient · 2+ Years', projects: ['Airbnb Clone', 'Zerodha Clone'] },
  { id: 'sql', name: 'MySQL / PostgreSQL', category: 'Database', color: '#0284C7', bg: '#F0F9FF', experience: 'Proficient · 2+ Years', projects: ['Relational DB Systems'] },
  { id: 'docker', name: 'Docker', category: 'Toolchain', color: '#0284C7', bg: '#F0F9FF', experience: 'Intermediate · Containerization', projects: ['Deployment Workflows'] },
  { id: 'git', name: 'Git & GitHub', category: 'Toolchain', color: '#DC2626', bg: '#FEF2F2', experience: 'Daily Driver · 4+ Years', projects: ['500+ Commits Across Repos'] },
  { id: 'postman', name: 'Postman', category: 'Toolchain', color: '#EA580C', bg: '#FFF7ED', experience: 'API Testing & Documentation', projects: ['RESTful Verification'] },
];

export const TechSandbox: React.FC = () => {
  const { triggerSound } = useSystem();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);
  const [zeroGravity, setZeroGravity] = useState<boolean>(false);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const itemsRef = useRef<TechItem[]>([]);
  const dragTargetRef = useRef<{ item: TechItem; offsetX: number; offsetY: number } | null>(null);

  // Initialize physics items
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 700;

    itemsRef.current = INITIAL_SKILLS.map((s, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      return {
        ...s,
        x: 80 + col * (width / 5.5) + (Math.random() - 0.5) * 30,
        y: 60 + row * 90 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2,
        radius: 42,
      };
    });
  }, []);

  // Physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const updatePhysics = () => {
      const width = canvas.width;
      const height = canvas.height;
      const gravity = zeroGravity ? 0.02 : 0.28;
      const friction = zeroGravity ? 0.995 : 0.98;
      const bounce = 0.65;

      const items = itemsRef.current;

      items.forEach((item, i) => {
        if (!item.isDragging) {
          item.vy += gravity;
          item.vx *= friction;
          item.vy *= friction;

          item.x += item.vx;
          item.y += item.vy;

          // Floor bounce
          if (item.y + item.radius > height) {
            item.y = height - item.radius;
            item.vy = -item.vy * bounce;
          }
          // Ceiling bounce
          if (item.y - item.radius < 0) {
            item.y = item.radius;
            item.vy = -item.vy * bounce;
          }
          // Left wall
          if (item.x - item.radius < 0) {
            item.x = item.radius;
            item.vx = -item.vx * bounce;
          }
          // Right wall
          if (item.x + item.radius > width) {
            item.x = width - item.radius;
            item.vx = -item.vx * bounce;
          }
        }

        // Inter-item collision
        for (let j = i + 1; j < items.length; j++) {
          const other = items[j];
          const dx = other.x - item.x;
          const dy = other.y - item.y;
          const dist = Math.hypot(dx, dy);
          const minDist = item.radius + other.radius + 6;

          if (dist < minDist && dist > 0) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            if (!item.isDragging) {
              item.x -= nx * overlap;
              item.y -= ny * overlap;
              item.vx -= nx * 0.8;
              item.vy -= ny * 0.8;
            }
            if (!other.isDragging) {
              other.x += nx * overlap;
              other.y += ny * overlap;
              other.vx += nx * 0.8;
              other.vy += ny * 0.8;
            }
          }
        }
      });

      // Clear & Draw
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid dots
      ctx.fillStyle = '#E2E8F0';
      for (let x = 20; x < width; x += 30) {
        for (let y = 20; y < height; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw items
      items.forEach((item) => {
        const isHovered = selectedTech?.id === item.id;
        const pillW = item.radius * 2.3;
        const pillH = item.radius * 0.95;

        ctx.save();
        ctx.translate(item.x, item.y);

        // Shadow
        ctx.shadowColor = isHovered ? item.color : 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = isHovered ? 18 : 8;
        ctx.shadowOffsetY = isHovered ? 6 : 3;

        // Pill Capsule
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);
        ctx.fillStyle = isHovered ? '#FFFFFF' : item.bg;
        ctx.fill();

        // Border
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = isHovered ? 2.5 : 1.2;
        ctx.strokeStyle = isHovered ? item.color : '#DAD8D1';
        ctx.stroke();

        // Dot indicator
        ctx.beginPath();
        ctx.arc(-pillW / 2 + 16, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();

        // Label Text
        ctx.fillStyle = '#111318';
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, 6, 0);

        ctx.restore();
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 380;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animId = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [zeroGravity, selectedTech]);

  // Pointer interaction
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hit = itemsRef.current.find((item) => {
      const dx = item.x - x;
      const dy = item.y - y;
      return Math.hypot(dx, dy) < item.radius * 1.1;
    });

    if (hit) {
      hit.isDragging = true;
      setIsDraggingActive(true);
      dragTargetRef.current = { item: hit, offsetX: hit.x - x, offsetY: hit.y - y };
      setSelectedTech(hit);
      triggerSound('click');
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragTargetRef.current) {
      const { x, y } = getCanvasCoords(e);
      const target = dragTargetRef.current.item;
      const newX = x + dragTargetRef.current.offsetX;
      const newY = y + dragTargetRef.current.offsetY;

      target.vx = (newX - target.x) * 0.45;
      target.vy = (newY - target.y) * 0.45;
      target.x = newX;
      target.y = newY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDraggingActive(false);
    if (dragTargetRef.current) {
      dragTargetRef.current.item.isDragging = false;
      dragTargetRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleScatter = useCallback(() => {
    triggerSound('command');
    itemsRef.current.forEach((item) => {
      item.vx = (Math.random() - 0.5) * 16;
      item.vy = -Math.random() * 12 - 4;
    });
  }, [triggerSound]);

  const handleReset = useCallback(() => {
    triggerSound('click');
    const width = canvasRef.current?.width || 700;
    itemsRef.current.forEach((item, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      item.x = 90 + col * (width / 5.5);
      item.y = 70 + row * 95;
      item.vx = 0;
      item.vy = 0;
    });
  }, [triggerSound]);

  return (
    <div className="w-full space-y-4">
      {/* Playground Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-studio">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#111318] flex items-center gap-2">
              TACTILE TECH PHYSICS SANDBOX
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] font-bold">
                INTERACTIVE
              </span>
            </div>
            <div className="text-[11px] text-[#646873]">
              Grab, toss, or bounce technology pills with realistic spring collision physics.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setZeroGravity(!zeroGravity);
              triggerSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              zeroGravity
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'bg-[#F6F5F0] border-[#DAD8D1] text-[#646873] hover:text-[#111318]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{zeroGravity ? 'ZERO GRAVITY: ON' : 'ZERO GRAVITY'}</span>
          </button>

          <button
            onClick={handleScatter}
            className="px-3 py-1.5 rounded-lg bg-[#F6F5F0] border border-[#DAD8D1] text-xs font-mono font-semibold text-[#646873] hover:text-[#2563EB] hover:border-[#2563EB]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Scatter pills with velocity burst"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SCATTER</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-[#F6F5F0] border border-[#DAD8D1] text-xs font-mono font-semibold text-[#646873] hover:text-[#111318] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to organized grid"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ALIGN</span>
          </button>
        </div>
      </div>

      {/* Interactive Physics Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[380px] rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-studio overflow-hidden select-none cursor-grab active:cursor-grabbing"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block"
          style={{ touchAction: isDraggingActive ? 'none' : 'pan-y' }}
        />

        {/* Selected Tech Inspector Popup */}
        {selectedTech && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md p-4 rounded-xl bg-white/95 backdrop-blur-md border border-[#DAD8D1] shadow-xl text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedTech.color }} />
                <span className="font-mono font-bold text-sm text-[#111318]">{selectedTech.name}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F6F5F0] border border-[#DAD8D1] text-[#646873]">
                  {selectedTech.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedTech(null)}
                className="text-[#8E929D] hover:text-[#111318] font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-[#646873] flex items-center gap-1.5 font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{selectedTech.experience}</span>
            </div>

            <div className="pt-2 border-t border-[#DAD8D1]/60 text-[11px] font-mono text-[#646873]">
              <span className="text-[#111318] font-bold">Verified in: </span>
              {selectedTech.projects.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
