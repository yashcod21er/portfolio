import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const [enabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !isTouch && !prefersReducedMotion;
  });

  const [hovered, setHovered] = useState(false);
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Detect cursor context
      const target = e.target as HTMLElement | null;
      if (target) {
        const projectEl = target.closest('[data-cursor="view"]') || target.closest('.project-card');
        const imageEl = target.closest('[data-cursor="open"]');
        const interactiveEl = target.closest('a, button, [role="button"], input, textarea, select, [data-interactive="true"]');

        if (projectEl) {
          setCursorText('VIEW');
          setHovered(true);
        } else if (imageEl) {
          setCursorText('OPEN');
          setHovered(true);
        } else if (interactiveEl) {
          setCursorText(null);
          setHovered(true);
        } else {
          setCursorText(null);
          setHovered(false);
        }
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    // Smooth lerp loop for outer ring
    let animId: number;
    const updateRing = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animId = requestAnimationFrame(updateRing);
    };

    animId = requestAnimationFrame(updateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [enabled, isVisible]);

  if (!enabled) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden select-none transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Inner precise dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -ml-1 -mt-1 rounded-full bg-[#111318] transition-opacity duration-150 will-change-transform ${
          cursorText ? 'opacity-0' : 'w-2 h-2 opacity-100'
        }`}
      />

      {/* Outer trailing ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full transition-all duration-200 ease-out will-change-transform flex items-center justify-center ${
          cursorText
            ? 'w-14 h-14 -ml-7 -mt-7 bg-[#111318] text-white text-[10px] font-mono font-bold tracking-wider'
            : hovered
            ? 'w-9 h-9 -ml-4.5 -mt-4.5 border border-[#2563EB] bg-[#2563EB]/5'
            : 'w-7 h-7 -ml-3.5 -mt-3.5 border border-[#111318]/40'
        }`}
      >
        {cursorText}
      </div>
    </div>
  );
};
