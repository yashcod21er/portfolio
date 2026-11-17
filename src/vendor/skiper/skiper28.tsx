// Source: Skiper UI — 3D perspective text (skiper28) by gxuri, https://skiper-ui.com/v1/skiper28
// License: free for personal & commercial use with attribution to Skiper UI.
/**
 * Skiper 28 PerspectiveTextScroll — React + framer motion + lenis
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
 * - framer-motion -> motion/react; the component's own ReactLenis root is removed (Lenis is global).
 * - Demo copy and the 300vh scroll container are gone. Instead of reading its own useScroll(),
 *   the plane is driven by a `progress` MotionValue (0 → 1) so a pinned GSAP timeline can own it.
 * - Same idea as the original: a perspective stage with a preserve-3d plane that starts tilted
 *   back (rotateX) and pushed down (translateY) and settles flat and upright as progress hits 1.
 * - `backdrop` renders inside the same perspective (e.g. tunnel frames) but outside the tilted plane.
 */
import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

export interface PerspectiveTextProps {
  /** 0 = tilted back and lowered, 1 = flat and readable. */
  progress: MotionValue<number>;
  children: ReactNode;
  /** Rendered inside the perspective stage, behind/around the plane, untilted. */
  backdrop?: ReactNode;
  /** CSS perspective of the stage in px. Original: 200px (very strong). */
  perspective?: number;
  /** rotateX of the plane at progress 0, in degrees. Original: 30. */
  tilt?: number;
  /** translateY of the plane at progress 0, in % of the plane's height. */
  lift?: number;
  className?: string;
  planeClassName?: string;
}

export function PerspectiveText({
  progress,
  children,
  backdrop,
  perspective = 900,
  tilt = 30,
  lift = 20,
  className,
  planeClassName,
}: PerspectiveTextProps) {
  const rotateX = useTransform(progress, [0, 1], [tilt, 0]);
  const y = useTransform(progress, [0, 1], [lift, 0]);
  const transform = useMotionTemplate`rotateX(${rotateX}deg) translateY(${y}%) translateZ(0px)`;

  return (
    <div
      className={cn('relative', className)}
      style={{ perspective: `${perspective}px`, transformStyle: 'preserve-3d' }}
    >
      {backdrop}
      <motion.div className={cn('relative', planeClassName)} style={{ transformStyle: 'preserve-3d', transform }}>
        {children}
      </motion.div>
    </div>
  );
}

export default PerspectiveText;
