// Source: Skiper UI — Progressive Blur (skiper41) by gxuri, https://skiper-ui.com/v1/skiper41
// License: free for personal & commercial use with attribution to Skiper UI.
/**
 * Skiper 41 Canvas_Landing_004 — React + framer motion
 * Inspired by and adapted from https://devouringdetails.com/
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 *
 * Author: @gurvinder-singh02 · Website: https://gxuri.me
 *
 * Adapted for Yash Hogade's portfolio: demo scroller removed; can be `fixed` to the viewport;
 * stacks several backdrop-blur layers with staggered masks so the blur genuinely ramps up
 * toward the edge (one layer = the original single-blur behaviour); tint is an ink colour.
 */
import type { CSSProperties, Ref } from 'react';

import { cn } from '@/lib/utils';

export type ProgressiveBlurProps = {
  className?: string;
  /** tint colour that the band fades into at the edge */
  backgroundColor?: string;
  position?: 'top' | 'bottom';
  height?: string;
  /** strongest blur (at the very edge), in px */
  blurAmount?: number;
  /** number of stacked blur layers; 1 = original skiper41 behaviour */
  layers?: number;
  /** pin to the viewport instead of the nearest positioned ancestor */
  fixed?: boolean;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
};

export const ProgressiveBlur = ({
  className,
  backgroundColor = 'rgb(11 13 14 / 0.6)',
  position = 'top',
  height = '150px',
  blurAmount = 4,
  layers = 3,
  fixed = false,
  style,
  ref,
}: ProgressiveBlurProps) => {
  const isTop = position === 'top';
  // gradients run from the inner edge of the band (0%) to the viewport edge (100%)
  const toward = isTop ? 'to top' : 'to bottom';
  const n = Math.max(1, Math.round(layers));

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none left-0 w-full select-none', fixed ? 'fixed' : 'absolute', className)}
      style={{ [isTop ? 'top' : 'bottom']: 0, height, ...style }}
    >
      {Array.from({ length: n }, (_, i) => {
        const blur = n === 1 ? blurAmount : blurAmount / Math.pow(2, n - 1 - i);
        const mask =
          n === 1
            ? `linear-gradient(${toward}, transparent, #000 50%)`
            : `linear-gradient(${toward}, transparent ${(i / n) * 100}%, #000 ${((i + 1) / n) * 100}%)`;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              WebkitBackdropFilter: `blur(${blur}px)`,
              backdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
      <div className="absolute inset-0" style={{ background: `linear-gradient(${toward}, transparent, ${backgroundColor})` }} />
    </div>
  );
};

export default ProgressiveBlur;
