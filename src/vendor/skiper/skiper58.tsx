// Source: Skiper UI — Text roll navigation (skiper58) by gxuri, https://skiper-ui.com/v1/skiper58
// License: free for personal & commercial use with attribution to Skiper UI.
//
// Adapted for Yash Hogade's portfolio: framer-motion -> motion/react, demo nav list removed,
// expo/quart eases, reduced-motion support, an `inherit` mode so a parent motion element
// (e.g. a link with whileHover + whileFocus) can drive the roll, and the visual copy is
// aria-hidden (the caller supplies the accessible name).

import { motion, useReducedMotion, type Transition } from 'motion/react';

import { cn } from '@/lib/utils';

const STAGGER = 0.035;
const EASE = [0.76, 0, 0.24, 1] as const;

export interface TextRollProps {
  children: string;
  className?: string;
  /** stagger outward from the middle letter instead of left to right */
  center?: boolean;
  /**
   * Don't own the hover state: inherit the "initial" / "hovered" variants from the nearest
   * motion parent (set `initial="initial" whileHover="hovered" whileFocus="hovered"` there).
   */
  inherit?: boolean;
  stagger?: number;
  duration?: number;
}

const top = { initial: { y: '0%' }, hovered: { y: '-100%' } };
const bottom = { initial: { y: '100%' }, hovered: { y: '0%' } };

export function TextRoll({ children, className, center = false, inherit = false, stagger = STAGGER, duration = 0.5 }: TextRollProps) {
  const reduce = useReducedMotion();
  const letters = Array.from(children);
  const mid = (letters.length - 1) / 2;
  const t = (i: number): Transition =>
    reduce
      ? { duration: 0 }
      : { ease: EASE, duration, delay: center ? stagger * Math.abs(i - mid) : stagger * i };

  const row = (variants: typeof top) =>
    letters.map((l, i) => (
      <motion.span key={i} variants={variants} transition={t(i)} className="inline-block">
        {l === ' ' ? ' ' : l}
      </motion.span>
    ));

  return (
    <motion.span
      {...(inherit ? {} : { initial: 'initial', whileHover: 'hovered' })}
      aria-hidden="true"
      className={cn('relative block overflow-hidden whitespace-nowrap', className)}
    >
      <span className="block">{row(top)}</span>
      <span className="absolute inset-0 block">{row(bottom)}</span>
    </motion.span>
  );
}

export default TextRoll;
