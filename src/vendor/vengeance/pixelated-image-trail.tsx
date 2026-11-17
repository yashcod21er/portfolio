// Source: Vengeance UI — pixelated-image-trail, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
//
// Adapted for this portfolio:
// - the layer never takes pointer events: it listens to a host element (`targetRef`, default:
//   the parent), so rows / links underneath keep hover, click and focus;
// - the image comes from the host at spawn time (`getImage`), so the trail shows whatever the
//   pointer is over; a change of image spawns immediately;
// - "pixelated" literally: each trail frame is a <canvas> that steps up in resolution
//   (blocky → sharp) on the way in and back down on the way out, instead of clip-path slices;
// - the newest frame (the head) stays while the pointer rests, older frames fade on a timer;
// - frames keep the image's own aspect ratio and are kept inside the layer horizontally;
// - restyled to the site tokens (square corners, hairline edge). Demo images removed.

import { useEffect, useRef, type RefObject } from 'react';
import { cn } from '@/lib/utils';

interface TrailConfig {
  /** how long a frame lives after a newer one replaces it (ms) */
  imageLifespan: number;
  /** total time of the pixelate-in steps (ms) */
  inDuration: number;
  /** total time of the pixelate-out + fade (ms) */
  outDuration: number;
  slideDuration: number;
  slideEasing: string;
  easing: string;
}

export interface PixelatedImageTrailProps {
  className?: string;
  /** every image the trail may show; preloaded on mount */
  images: string[];
  /** the image to spawn now (null = spawn nothing) */
  getImage: () => string | null;
  /** element whose pointer movement drives the trail (default: the layer's parent) */
  targetRef?: RefObject<HTMLElement | null>;
  config?: Partial<TrailConfig>;
  /** low-res widths (in blocks) stepped through before the sharp frame */
  steps?: number[];
  spawnThreshold?: number;
  smoothing?: number;
  /** frame width in px, or a function evaluated at spawn time */
  imageWidth?: number | (() => number);
  maxImages?: number;
}

const DEFAULT_CONFIG: TrailConfig = {
  imageLifespan: 650,
  inDuration: 300,
  outDuration: 520,
  slideDuration: 1300,
  slideEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface Frame {
  el: HTMLDivElement;
  canvas: HTMLCanvasElement;
  src: string;
  dying: boolean;
}

export function PixelatedImageTrail({
  className,
  images,
  getImage,
  targetRef,
  config: configOverride,
  steps = [6, 12, 24, 48],
  spawnThreshold = 90,
  smoothing = 0.2,
  imageWidth = 300,
  maxImages = 8,
}: PixelatedImageTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(new Map<string, HTMLImageElement>());

  // Latest props, read inside the rAF loop without restarting it.
  const live = useRef({ getImage, imageWidth, steps, spawnThreshold, smoothing, maxImages, configOverride });
  useEffect(() => {
    live.current = { getImage, imageWidth, steps, spawnThreshold, smoothing, maxImages, configOverride };
  });

  const imagesKey = images.join('|');
  useEffect(() => {
    let alive = true;
    const loaded = loadedRef.current;
    imagesKey.split('|').forEach((src) => {
      if (!src || loaded.has(src)) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (alive) loaded.set(src, img);
      };
      img.src = src;
    });
    return () => {
      alive = false;
    };
  }, [imagesKey]);

  useEffect(() => {
    const container = containerRef.current;
    const target = targetRef?.current ?? container?.parentElement;
    if (!container || !target) return;

    const timeouts = new Set<number>();
    const frames: Frame[] = [];
    let head: Frame | null = null;
    let raf = 0;
    let active = false;
    const client = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    const interp = { x: 0, y: 0 };
    const lastSpawn = { x: 0, y: 0 };

    const cfg = () => ({ ...DEFAULT_CONFIG, ...live.current.configOverride });
    const schedule = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timeouts.delete(t);
        fn();
      }, ms);
      timeouts.add(t);
    };

    const toLocal = () => {
      const rect = container.getBoundingClientRect();
      pos.x = client.x - rect.left;
      pos.y = client.y - rect.top;
    };

    const draw = (frame: Frame, blocks: number | null) => {
      const img = loadedRef.current.get(frame.src);
      const { canvas } = frame;
      const ctx = canvas.getContext('2d');
      if (!img || !ctx) return;
      const aspect = img.naturalHeight / img.naturalWidth;
      if (blocks === null) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.round(canvas.clientWidth * aspect * dpr));
        canvas.style.imageRendering = 'auto';
      } else {
        canvas.width = blocks;
        canvas.height = Math.max(1, Math.round(blocks * aspect));
        canvas.style.imageRendering = 'pixelated';
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = blocks === null ? 'high' : 'low';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const kill = (frame: Frame, delay: number) => {
      if (frame.dying) return;
      frame.dying = true;
      const c = cfg();
      const ladder = [...live.current.steps].reverse();
      const stepMs = (c.outDuration * 0.6) / Math.max(1, ladder.length);
      schedule(() => {
        ladder.forEach((b, i) => schedule(() => draw(frame, b), i * stepMs));
        schedule(() => {
          frame.el.style.opacity = '0';
          frame.el.style.transform = 'translate3d(0, 0, 0) scale(0.86)';
        }, ladder.length * stepMs * 0.5);
        schedule(() => {
          frame.el.remove();
          const idx = frames.indexOf(frame);
          if (idx >= 0) frames.splice(idx, 1);
        }, c.outDuration + 40);
      }, delay);
    };

    const spawn = (src: string) => {
      const img = loadedRef.current.get(src);
      if (!img) return;
      const c = cfg();
      const iw = live.current.imageWidth;
      const width = Math.round(typeof iw === 'function' ? iw() : iw);
      const height = Math.round((width * img.naturalHeight) / img.naturalWidth);
      const bound = container.clientWidth;
      const fit = (x: number) => clamp(x, 0, Math.max(0, bound - width));

      const startX = fit(interp.x - width / 2);
      const startY = interp.y - height / 2;
      const targetX = fit(startX + (pos.x - interp.x) * 0.45);
      const targetY = startY + (pos.y - interp.y) * 0.45;
      const tilt = clamp((pos.x - interp.x) * 0.05, -5, 5);

      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'absolute',
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: '1',
        transform: `translate3d(0, 0, 0) rotate(${tilt}deg)`,
        transition: [
          `left ${c.slideDuration}ms ${c.slideEasing}`,
          `top ${c.slideDuration}ms ${c.slideEasing}`,
          `opacity ${c.outDuration * 0.5}ms ${c.easing}`,
          `transform ${c.outDuration}ms ${c.easing}`,
        ].join(', '),
        willChange: 'left, top, opacity, transform',
        background: 'var(--color-ink-2)',
        boxShadow: '0 0 0 1px var(--color-line), 0 24px 48px -24px rgb(0 0 0 / 0.6)',
        contain: 'layout style paint',
      } satisfies Partial<CSSStyleDeclaration>);

      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
      el.appendChild(canvas);
      container.appendChild(el);

      const frame: Frame = { el, canvas, src, dying: false };
      frames.push(frame);

      // pixelate in: blocky → sharp
      const ladder = live.current.steps;
      const stepMs = c.inDuration / Math.max(1, ladder.length);
      draw(frame, ladder[0] ?? null);
      ladder.slice(1).forEach((b, i) => schedule(() => draw(frame, b), (i + 1) * stepMs));
      schedule(() => draw(frame, null), ladder.length * stepMs);

      requestAnimationFrame(() => {
        if (el.parentElement !== container) return;
        el.style.left = `${targetX}px`;
        el.style.top = `${targetY}px`;
      });

      if (head) kill(head, c.imageLifespan);
      head = frame;

      const alive = frames.filter((f) => !f.dying);
      while (alive.length > live.current.maxImages) {
        const old = alive.shift();
        if (old) kill(old, 0);
      }
    };

    const render = () => {
      raf = 0;
      if (active) {
        toLocal();
        const k = clamp(live.current.smoothing, 0.01, 1);
        interp.x += (pos.x - interp.x) * k;
        interp.y += (pos.y - interp.y) * k;
        const src = live.current.getImage();
        if (src && loadedRef.current.has(src)) {
          const moved = Math.hypot(interp.x - lastSpawn.x, interp.y - lastSpawn.y);
          if (!head || head.dying || head.src !== src || moved > Math.max(1, live.current.spawnThreshold)) {
            lastSpawn.x = interp.x;
            lastSpawn.y = interp.y;
            spawn(src);
          }
        }
        raf = requestAnimationFrame(render);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      client.x = event.clientX;
      client.y = event.clientY;
      if (!active) {
        active = true;
        toLocal();
        interp.x = pos.x;
        interp.y = pos.y;
        lastSpawn.x = pos.x;
        lastSpawn.y = pos.y;
        if (!raf) raf = requestAnimationFrame(render);
      }
    };

    const onLeave = () => {
      active = false;
      if (head) kill(head, 60);
      head = null;
    };

    target.addEventListener('pointerenter', onMove);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerleave', onLeave);

    return () => {
      target.removeEventListener('pointerenter', onMove);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      timeouts.forEach((t) => window.clearTimeout(t));
      timeouts.clear();
      frames.length = 0;
      container.replaceChildren();
    };
  }, [targetRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    />
  );
}

export default PixelatedImageTrail;
