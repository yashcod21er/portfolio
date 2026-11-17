// Source: Skiper UI — SVG clip path mask (skiper66) by gxuri, https://skiper-ui.com/v1/skiper66
// License: free for personal & commercial use with attribution to Skiper UI.
//
// Adapted for Yash Hogade's portfolio: demo image/heading removed; the clip shape is a prop
// (any SVG shapes or <text>), ids come from the caller so several masks can coexist; adds
// `ClipSvg`, an all-SVG variant (clipPath + content inside one <svg>) which repaints reliably in
// every engine when the clip children are animated — used for the footer's photo-filled
// wordmark. `ClipDiv` keeps the original HTML-element-clipped-by-SVG approach.
//
// Use clipPath for clean geometric cuts. Use mask for blurry, faded, or complex visual effects.

import type { ReactNode, SVGProps } from 'react';

import { cn } from '@/lib/utils';

/** The original skiper66 hand-drawn rounded-rect, in objectBoundingBox units. */
export const BLOB_PATH =
  'M457.525 1.148c-20.789-3.198-193.979 1.16-283.854 2.496 11.104-.178 1.297-2.868-81.146-2.496-103.5.468-86 102.499-86 109.999s-7 524.5-6.5 547.5 10 59 6.5 99c-2.8 32-1.167 234.667 0 332.003.5 75 62.5 66.5 67 68.5s38.5 0 81.5 0 436 6 526 10.5 438.995-.5 505.495 0 330.01-12.5 417.51-12.5 230.99 2 270.99 0 40.5-16 51-31.5 12.5-61 12.5-105.5c0-44.503 7.01-274.504 7.01-348.004s-3.51-159.998-7.01-230.998 0-256.002 0-318.002 7.01-92.998-22.5-110.999c-18.79-11.471-81.99-9.999-133.49-9.999H853.525c-29 0-370 4-396 0Z';

/** Hidden <svg> that only defines a clipPath (objectBoundingBox units) for HTML elements. */
export function SvgClipDefs({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute" focusable="false">
      <clipPath id={id} clipPathUnits="objectBoundingBox">
        {children ?? <path d={BLOB_PATH} transform="scale(0.0005139987561, 0.0008543065594)" />}
      </clipPath>
    </svg>
  );
}

/** HTML box clipped by an SVG clipPath, image scales on hover (the original skiper66). */
export function ClipDiv({
  id,
  imgSrc,
  children,
  className,
  clip,
}: {
  id: string;
  imgSrc: string;
  children?: ReactNode;
  className?: string;
  /** objectBoundingBox-unit shapes; defaults to the skiper66 blob */
  clip?: ReactNode;
}) {
  return (
    <>
      <SvgClipDefs id={id}>{clip}</SvgClipDefs>
      <div
        style={{ clipPath: `url(#${id})` }}
        className={cn('group relative flex items-center justify-center overflow-hidden', className)}
      >
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-110"
        />
        <div className="absolute size-full bg-ink/15" />
        {children && <div className="absolute">{children}</div>}
      </div>
    </>
  );
}

/**
 * All-SVG clip: `shape` (shapes / text in viewBox units) cuts `children` (an <image>, <rect>…).
 * Everything lives in one <svg>, so animating the clip shapes repaints everywhere.
 */
export function ClipSvg({
  id,
  shape,
  children,
  className,
  ...rest
}: { id: string; shape: ReactNode; children: ReactNode } & Omit<SVGProps<SVGSVGElement>, 'children' | 'id' | 'clip'>) {
  return (
    <svg aria-hidden="true" focusable="false" className={cn('block overflow-hidden', className)} {...rest}>
      <defs>
        <clipPath id={id}>{shape}</clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </svg>
  );
}

export default ClipSvg;
