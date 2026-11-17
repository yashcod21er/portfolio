// Source: Vengeance UI — image-scatter, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
//
// Adapted for this portfolio: instead of cycling scattered photo cards around a heading, one
// image is cut into a cols × rows grid of tiles that start scattered (flung outward, rotated,
// some flipped) and fly together into the full picture, scrubbed by ScrollTrigger. The resting
// DOM is the assembled image (gsap.from), so it is complete without JS or with `disabled`.
// GSAP comes from src/lib/gsap (plugins registered once); demo data and headings removed.
// While the tiles are not yet home the root carries [data-scattered] for the host to style.

import { useLayoutEffect, useMemo, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { cn } from '@/lib/utils';

export interface ImageScatterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  src: string;
  alt: string;
  /** intrinsic size of the image (layout hint for the <img>) */
  width?: number;
  height?: number;
  cols?: number;
  rows?: number;
  /** CSS object-position for the cover crop */
  objectPosition?: string;
  /** how far tiles fly, as a multiple of the frame size */
  spread?: number;
  /** ScrollTrigger trigger element (defaults to the frame) */
  trigger?: () => Element | null | undefined;
  start?: ScrollTrigger.Vars['start'];
  end?: ScrollTrigger.Vars['end'];
  scrub?: boolean | number;
  /** seed for the scatter layout, so it is stable across refreshes */
  seed?: number;
  /** render assembled, no scroll animation (reduced motion) */
  disabled?: boolean;
  /** 0 = scattered, 1 = assembled */
  onAssemble?: (progress: number) => void;
  imgClassName?: string;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DONE = 0.985;

export function ImageScatter({
  src,
  alt,
  width,
  height,
  cols = 5,
  rows = 6,
  objectPosition = '50% 50%',
  spread = 1,
  trigger,
  start = 'top 90%',
  end = 'top 30%',
  scrub = 0.8,
  seed = 7,
  disabled = false,
  onAssemble,
  imgClassName,
  className,
  style,
  ...props
}: ImageScatterProps) {
  const root = useRef<HTMLDivElement>(null);
  const progressRef = useRef(onAssemble);
  const opts = useRef({ trigger, start, end, spread });
  // Latest props for the GSAP callbacks, synced before useGSAP's layout effect runs.
  useLayoutEffect(() => {
    progressRef.current = onAssemble;
    opts.current = { trigger, start, end, spread };
  });

  const tiles = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      // fling outward from the centre, with jitter
      const cx = (c + 0.5) / cols - 0.5;
      const cy = (r + 0.5) / rows - 0.5;
      const angle = Math.atan2(cy || 0.01, cx || 0.01) + (rand() - 0.5) * 1.1;
      return {
        c,
        r,
        angle,
        dist: 0.35 + rand() * 0.85,
        rot: (rand() - 0.5) * 110,
        flip: rand() < 0.28,
        scale: 0.55 + rand() * 0.6,
        delay: rand() * 0.6,
      };
    });
  }, [cols, rows, seed]);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || disabled) return;
      const nodes = gsap.utils.toArray<HTMLElement>('[data-tile]', el);
      const base = el.querySelector('[data-scatter-base]');
      const { trigger: getTrigger, start: s, end: e } = opts.current;

      const report = (p: number) => {
        el.toggleAttribute('data-scattered', p < DONE);
        progressRef.current?.(p);
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: getTrigger?.() ?? el,
          start: s,
          end: e,
          scrub,
          invalidateOnRefresh: true,
          onUpdate: (self) => report(self.progress),
          onRefresh: (self) => report(self.progress),
        },
      });

      const k = () => opts.current.spread;
      // Perspective is a constant, not part of the tween (a `from` would animate it to 0).
      gsap.set(nodes, { transformPerspective: 900 });
      tl.from(
        nodes,
        {
          x: (i: number) => Math.cos(tiles[i].angle) * tiles[i].dist * el.offsetWidth * k(),
          y: (i: number) => Math.sin(tiles[i].angle) * tiles[i].dist * el.offsetHeight * k(),
          rotation: (i: number) => tiles[i].rot,
          rotationY: (i: number) => (tiles[i].flip ? 180 : 0),
          scale: (i: number) => tiles[i].scale,
          duration: 1,
          ease: 'power3.out',
          stagger: (i: number) => tiles[i].delay,
        },
        0,
      );
      if (base) tl.from(base, { opacity: 0, duration: 0.12 }, '>-0.08');

      report(tl.scrollTrigger?.progress ?? 0);
      return () => el.removeAttribute('data-scattered');
    },
    { scope: root, dependencies: [disabled, tiles, scrub], revertOnUpdate: true },
  );

  const bg = `url("${src}")`;

  return (
    <div ref={root} className={cn('relative', className)} style={style} {...props}>
      <img
        data-scatter-base
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        style={{ objectPosition }}
      />
      <div
        aria-hidden
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((t, i) => (
          <div key={i} data-tile className="relative overflow-hidden will-change-transform">
            <div
              className={cn('absolute', imgClassName)}
              style={
                {
                  left: `${-t.c * 100}%`,
                  top: `${-t.r * 100}%`,
                  width: `${cols * 100}%`,
                  height: `${rows * 100}%`,
                  backgroundImage: bg,
                  backgroundSize: 'cover',
                  backgroundPosition: objectPosition,
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageScatter;
