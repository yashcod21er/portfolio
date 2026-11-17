// Source: Skiper UI — Mouse follow animations (skiper61) by gxuri, https://skiper-ui.com/v1/skiper61
// License: free for personal & commercial use with attribution to Skiper UI.
//
// Adapted for Yash Hogade's portfolio: the "spring mouse follow" variant only, following the
// pointer across the whole viewport (window listener, mouse/pen only) instead of a demo box;
// framer-motion -> motion/react; the follower is a tiny ochre bead used as a cursor trail.

import { useEffect, type Ref } from 'react';
import { motion, useSpring } from 'motion/react';

import { cn } from '@/lib/utils';

const SPRING = {
  mass: 0.1, // lower mass = snappier
  damping: 10, // lower damping = more bounce
  stiffness: 131, // rubber-band pull back to the pointer
};

export interface SpringFollowProps {
  className?: string;
  /** wrapper ref — the caller may fade it (opacity) without fighting the spring transform */
  ref?: Ref<HTMLDivElement>;
  spring?: typeof SPRING;
  size?: number;
}

/** A bead that springs after the pointer. Fixed to the viewport, never takes pointer events. */
export function SpringFollow({ className, ref, spring = SPRING, size = 5 }: SpringFollowProps) {
  const x = useSpring(-100, spring);
  const y = useSpring(-100, spring);

  useEffect(() => {
    let first = true;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      if (first) {
        first = false;
        x.jump(e.clientX);
        y.jump(e.clientY);
        return;
      }
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[10000]">
      <motion.div
        style={{ x, y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
        className={cn('rounded-full bg-ochre will-change-transform', className)}
      />
    </div>
  );
}

export default SpringFollow;
