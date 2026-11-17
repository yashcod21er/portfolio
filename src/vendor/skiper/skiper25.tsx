// Source: Skiper UI — Music toggle btn (skiper25) by gxuri, https://skiper-ui.com/v1/skiper25
// License: free for personal & commercial use with attribution to Skiper UI.
/**
 * Skiper 25 Micro Interactions_005 — React + framer motion + use-sound
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · Website: https://gxuri.me
 *
 * Adapted for Yash Hogade's portfolio: use-sound and the audio file removed (the caller owns
 * playback — here a generated WebAudio engine), controlled `playing` / `checked` props,
 * a real <button role="switch">, the padding spring moved to an absolutely positioned pill so
 * the nav doesn't reflow, framer-motion -> motion/react, reduced-motion = still bars.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

const STILL = [0.45, 0.85, 0.6, 1, 0.5];

const randomHeights = (n: number) => Array.from({ length: n }, () => Math.random() * 0.8 + 0.2);

/** Animated waveform bars; flat when not playing. */
export function SoundBars({ playing, bars = 5, className }: { playing: boolean; bars?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(() => randomHeights(bars));

  useEffect(() => {
    if (!playing || reduce) return;
    const id = window.setInterval(() => setLive(randomHeights(bars)), 110);
    return () => window.clearInterval(id);
  }, [playing, reduce, bars]);

  const heights = !playing
    ? Array<number>(bars).fill(0.1)
    : reduce
      ? Array.from({ length: bars }, (_, i) => STILL[i % STILL.length])
      : live;

  return (
    <span aria-hidden="true" className={cn('flex h-[14px] items-center gap-[3px]', className)}>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="block w-px rounded-full bg-current"
          initial={{ height: 1 }}
          animate={{ height: Math.max(2, h * 14) }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 10 }}
        />
      ))}
    </span>
  );
}

export interface MusicToggleButtonProps {
  /** switch state (the visitor's preference) */
  checked: boolean;
  /** whether audio is actually running — drives the bars */
  playing: boolean;
  onToggle: () => void;
  /** accessible name; the role=switch announces on/off */
  label?: string;
  className?: string;
  children?: ReactNode;
  onPointerEnter?: () => void;
}

export function MusicToggleButton({
  checked,
  playing,
  onToggle,
  label = 'Sound',
  className,
  children,
  onPointerEnter,
}: MusicToggleButtonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      onPointerEnter={onPointerEnter}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="hover"
      whileFocus="hover"
      className={cn('relative inline-flex items-center gap-2.5 px-2.5 py-1', className)}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-current opacity-50"
        variants={{ rest: { scaleX: 1, scaleY: 1 }, hover: { scaleX: 1.14, scaleY: 1.22 } }}
        transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1, bounce: 0.6 }}
      />
      <SoundBars playing={playing && checked} />
      {children}
    </motion.button>
  );
}

export default MusicToggleButton;
