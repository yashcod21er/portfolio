// Source: Skiper UI — Scroll images reveal 003 (skiper34) by gxuri, https://skiper-ui.com/v1/skiper34
// License: free for personal & commercial use with attribution to Skiper UI.
/**
 * Skiper 34 StickyCard_003 — React + framer motion + lenis
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */

/*
 * Adapted for this portfolio:
 * - framer-motion -> motion/react; ReactLenis root and the demo /images/lummi/* list removed.
 * - Kept the signature move of StickyCard_003: the frame scales + rotates while the image inside
 *   counter-rotates (and is over-scaled) so the picture stays level inside a turning window.
 * - Driven by a `progress` MotionValue (0 hidden → 1 revealed) instead of a sticky scrollY listener.
 * - Takes a set of images and an `active` index; the frame crossfades between them, so one
 *   window can preview whichever item is selected.
 * - Square corners, ink surface, hairline border (site tokens).
 */
import type { ReactNode } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

export interface RevealImage {
  src: string;
  alt: string;
}

export interface CounterRotateRevealProps {
  progress: MotionValue<number>;
  images: RevealImage[];
  active: number;
  /** Frame rotation at progress 0, in degrees (the image turns the other way). */
  maxRotate?: number;
  /** Frame scale at progress 0. */
  minScale?: number;
  className?: string;
  children?: ReactNode;
}

export function CounterRotateReveal({
  progress,
  images,
  active,
  maxRotate = 24,
  minScale = 0.3,
  className,
  children,
}: CounterRotateRevealProps) {
  const scale = useTransform(progress, [0, 1], [minScale, 1]);
  const rotate = useTransform(progress, [0, 1], [maxRotate, 0]);
  const negateRotate = useTransform(rotate, (value) => -value);
  const innerScale = useTransform(progress, [0, 1], [1.6, 1.08]);
  const opacity = useTransform(progress, [0, 0.2], [0, 1]);

  return (
    <motion.div
      className={cn('relative overflow-hidden border border-line bg-ink-2', className)}
      style={{ scale, rotate, opacity }}
    >
      {images.map((img, i) => (
        <motion.img
          key={img.src}
          src={img.src}
          alt={i === active ? img.alt : ''}
          aria-hidden={i === active ? undefined : true}
          draggable={false}
          decoding="async"
          style={{ rotate: negateRotate, scale: innerScale }}
          className={cn(
            'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ease-expo',
            i === active ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      {children}
    </motion.div>
  );
}

export default CounterRotateReveal;
