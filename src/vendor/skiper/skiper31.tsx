// Source: Skiper UI — Text Scroll animation (skiper31) by gxuri, https://skiper-ui.com/v1/skiper31
// License: free for personal & commercial use with attribution to Skiper UI.
/**
 * Skiper 31 ScrollAnimation_002 — React + framer motion + lenis
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
 * - framer-motion -> motion/react; ReactLenis root removed (Lenis is global).
 * - Kept CharacterV1 (characters fan out from the centre on x + rotateX and converge as progress
 *   reaches 0.5). The icon variants (V2/V3), their demo /mac/* images and the bracket SVG are gone.
 * - Driven by a `progress` MotionValue instead of its own useScroll(); offsets are in `em` so the
 *   effect scales with the font size. Colour/typography come from the caller's classes.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

type CharacterProps = {
  char: string;
  index: number;
  centerIndex: number;
  progress: MotionValue<number>;
  spread: number;
  twist: number;
};

const Character = ({ char, index, centerIndex, progress, spread, twist }: CharacterProps) => {
  const isSpace = char === ' ';
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(progress, [0, 0.5], [`${distanceFromCenter * spread}em`, '0em']);
  const rotateX = useTransform(progress, [0, 0.5], [distanceFromCenter * twist, 0]);

  return (
    <motion.span className="inline-block will-change-transform" style={{ x, rotateX }}>
      {isSpace ? ' ' : char}
    </motion.span>
  );
};

export interface ScatterTextProps {
  text: string;
  /** 0 = scattered, ≥ 0.5 = assembled and readable. */
  progress: MotionValue<number>;
  /** Horizontal offset per character away from the centre at progress 0, in em. */
  spread?: number;
  /** rotateX per character away from the centre at progress 0, in degrees. Original: 50. */
  twist?: number;
  className?: string;
}

/** Decorative: hidden from assistive tech. Render the real sentence elsewhere (e.g. sr-only). */
export function ScatterText({ text, progress, spread = 0.45, twist = 50, className }: ScatterTextProps) {
  const characters = Array.from(text);
  const centerIndex = Math.floor(characters.length / 2);
  return (
    <span aria-hidden="true" className={cn('inline-block whitespace-nowrap', className)} style={{ perspective: '500px' }}>
      {characters.map((char, index) => (
        <Character
          key={index}
          char={char}
          index={index}
          centerIndex={centerIndex}
          progress={progress}
          spread={spread}
          twist={twist}
        />
      ))}
    </span>
  );
}

export default ScatterText;
