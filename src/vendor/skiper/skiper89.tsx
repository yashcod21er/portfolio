// Source: Skiper UI — Scroll progress 001 (skiper89) by gxuri, https://skiper-ui.com/v1/skiper89
// License: free for personal & commercial use with attribution to Skiper UI.
//
// Adapted for Yash Hogade's portfolio: @number-flow/react removed (a plain tabular-nums counter
// written straight to the DOM, no re-render per frame), drag + demo copy removed, split into a
// ring and a counter fed by a progress MotionValue so the chrome HUD can compose them;
// restyled to ink/bone/ochre.

import { useRef } from 'react';
import { motion, useMotionValueEvent, type MotionValue } from 'motion/react';

import { cn } from '@/lib/utils';

// Feed these with page progress, e.g.
//   const { scrollYProgress } = useScroll();
//   const progress = useTransform(scrollYProgress, (v) => Math.min(Math.max(v, 0), 1));

/** Circular progress ring (the skiper89 indicator). */
export function ProgressRing({
  progress,
  className,
  radius = 18,
  strokeWidth = 3,
}: {
  progress: MotionValue<number>;
  className?: string;
  radius?: number;
  strokeWidth?: number;
}) {
  return (
    <svg className={cn('size-10', className)} viewBox="0 0 48 48" role="presentation" aria-hidden="true">
      <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth={strokeWidth} className="opacity-25" fill="none" />
      <motion.circle
        cx="24"
        cy="24"
        r={radius}
        stroke="var(--color-ochre)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        style={{ pathLength: progress, rotate: -90, transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

/** "064%" — zero-padded percent counter, updated imperatively. */
export function ProgressCounter({
  progress,
  className,
  pad = 3,
  suffix = '%',
}: {
  progress: MotionValue<number>;
  className?: string;
  pad?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (v: number) => String(Math.round(v * 100)).padStart(pad, '0');
  useMotionValueEvent(progress, 'change', (v) => {
    if (ref.current) ref.current.textContent = fmt(v);
  });
  return (
    <span className={cn('tabular-nums', className)}>
      <span ref={ref}>{fmt(progress.get())}</span>
      {suffix}
    </span>
  );
}
