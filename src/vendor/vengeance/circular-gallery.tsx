// Source: Vengeance UI — circular-gallery, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
/*
 * Adapted for this portfolio (MIT, Copyright (c) 2025-2026 Ashutoshx7):
 * - Prop-driven items ({ id, src, title, meta }) instead of anonymous image URLs; no demo content.
 * - The ring is a vertical-axis carousel (cards face outward around Y, the ring tilted on X) so
 *   screenshots stay upright and legible. Kept from the original: the eased "current chases target"
 *   rotation, gentle auto-rotation, drag-to-spin, cursor parallax on the tilt, ResizeObserver fit,
 *   IntersectionObserver / page-visibility pausing and reduced-motion handling.
 * - Optional `rotationOffset` ref is added every frame, so a scrubbed scroll timeline can turn it.
 * - The centre preview is a `center` slot rendered inside the same 3D context, so the ring passes
 *   in front of and behind it. `onFrontChange` reports which item faces the viewer.
 * - Cards are real buttons (click / Enter opens; focus turns the ring to bring the card front).
 * - Depth fog (cards further back darken) replaces the light/dark radial backgrounds.
 *   Restyled to site tokens; no entrance tween (the host choreographs it).
 */
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { cn } from '@/lib/utils';

export interface CircularGalleryItem {
  id: string;
  src: string;
  title: string;
  /** Short mono tag shown on the card (e.g. "01"). */
  meta?: string;
}

export interface CircularGalleryProps {
  items: CircularGalleryItem[];
  /** How many times the item list is repeated around the ring. Defaults to 2. */
  repeat?: number;
  /** Ring tilt in degrees (rotateX). Negative = seen slightly from above. Defaults to -12. */
  tilt?: number;
  /** Slowly spin the ring on its own. Defaults to true. */
  autoRotate?: boolean;
  /** Auto-rotation speed in degrees per second. Defaults to 3. */
  autoRotateSpeed?: number;
  /** Parallax the ring's tilt toward the cursor (mouse only). Defaults to true. */
  parallax?: boolean;
  /** Extra rotation in degrees, read every frame (e.g. driven by scroll). */
  rotationOffset?: RefObject<number>;
  /** Rendered at the centre of the ring, inside the 3D scene. Sized by --cg-preview (16:10). */
  center?: ReactNode;
  onSelect?: (item: CircularGalleryItem, index: number) => void;
  onFrontChange?: (index: number) => void;
  onHoverChange?: (index: number | null) => void;
  /** Accessible name prefix for each card button. */
  cardLabel?: string;
  className?: string;
}

const norm = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

export function CircularGallery({
  items,
  repeat = 2,
  tilt = -12,
  autoRotate = true,
  autoRotateSpeed = 3,
  parallax = true,
  rotationOffset,
  center,
  onSelect,
  onFrontChange,
  onHoverChange,
  cardLabel = 'Open',
  className,
}: CircularGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const focusCardRef = useRef<(card: number) => void>(() => {});
  const dragMovedRef = useRef(false);

  // Live knobs and callbacks are read inside the ticker/handlers without rebuilding.
  const optsRef = useRef({ autoRotate, autoRotateSpeed, parallax, tilt });
  const cbRef = useRef({ onSelect, onFrontChange, onHoverChange });
  useEffect(() => {
    optsRef.current = { autoRotate, autoRotateSpeed, parallax, tilt };
    cbRef.current = { onSelect, onFrontChange, onHoverChange };
  });

  const itemCount = items.length;
  const cards = itemCount ? Array.from({ length: itemCount * Math.max(1, repeat) }, (_, k) => k) : [];

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const ring = ringRef.current;
    if (!root || !stage || !ring) return;

    const cardEls = Array.from(ring.querySelectorAll<HTMLElement>('[data-ring-item]'));
    const fogEls = cardEls.map((c) => Array.from(c.querySelectorAll<HTMLElement>('[data-ring-fog]')));
    const n = cardEls.length;
    if (!n || !itemCount) return;
    const inc = 360 / n;
    let radius = 320;

    // Size cards, preview and radius from the container, then scale the scene to fit.
    const layout = () => {
      // Layout size (ignores ancestor transforms, e.g. a host scaling this in).
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) return;
      const cardW = gsap.utils.clamp(96, 240, width * 0.15);
      const previewW = gsap.utils.clamp(180, 620, Math.min(width * 0.42, height * 0.62));
      radius = Math.max(previewW * 0.5 + cardW * 0.6, (cardW * n * 1.3) / (2 * Math.PI));
      root.style.setProperty('--cg-card', `${cardW}px`);
      root.style.setProperty('--cg-preview', `${previewW}px`);
      const tiltRad = (Math.abs(optsRef.current.tilt) * Math.PI) / 180;
      const needW = 2 * radius + cardW;
      const needH = previewW * 0.625 + 2 * radius * Math.sin(tiltRad) + cardW * 0.625 + 48;
      const scale = Math.min(1, (width - 16) / needW, (height - 16) / needH);
      gsap.set(stage, { scale: Math.max(0.2, scale) });
    };
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(root);
    layout();
    gsap.set(ring, { rotationX: optsRef.current.tilt, rotationY: 0 });

    // ── Rotation: eased current chasing a target, nudged by auto-spin + drag ──
    let current = 0;
    let target = 0;
    let lastFront = -1;
    let dragging = false;
    let lastX = 0;
    let startX = 0;
    let isInViewport = true;
    let isPageVisible = !document.hidden;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionQuery.matches;

    const tick = () => {
      if (!isInViewport || !isPageVisible) return;
      const { autoRotate: auto, autoRotateSpeed: speed } = optsRef.current;
      if (auto && !reducedMotion && !dragging) target += (speed / 60) * gsap.ticker.deltaRatio();
      current += (target - current) * 0.08;
      const base = current + (rotationOffset?.current ?? 0);
      let best = 0;
      let bestAbs = Infinity;
      for (let i = 0; i < n; i++) {
        const angle = base + i * inc;
        const rel = norm(angle);
        cardEls[i].style.transform = `rotateY(${angle.toFixed(2)}deg) translateZ(${radius.toFixed(1)}px)`;
        // Depth fog: 0 facing the viewer → ~0.84 at the back of the ring.
        const fog = ((1 - Math.cos((rel * Math.PI) / 180)) * 0.42).toFixed(3);
        for (const f of fogEls[i]) f.style.opacity = fog;
        if (Math.abs(rel) < bestAbs) {
          bestAbs = Math.abs(rel);
          best = i;
        }
      }
      const front = best % itemCount;
      if (front !== lastFront) {
        lastFront = front;
        cbRef.current.onFrontChange?.(front);
      }
    };
    gsap.ticker.add(tick);
    tick();

    // Keyboard focus turns the ring so the focused card comes to the front.
    focusCardRef.current = (card: number) => {
      const offset = rotationOffset?.current ?? 0;
      target = current - norm(card * inc + current + offset);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = entry.isIntersecting;
      },
      { rootMargin: '160px' },
    );
    const onVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };
    visibilityObserver.observe(root);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    // ── Drag to spin (horizontal; vertical touch pans still scroll the page) ──
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      dragMovedRef.current = false;
      lastX = startX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (optsRef.current.parallax && e.pointerType === 'mouse' && !reducedMotion) {
        const rect = root.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(ring, {
          rotationX: optsRef.current.tilt + py * 5,
          rotationY: px * 6,
          duration: 1.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      if (dragging) {
        target += (e.clientX - lastX) * 0.25;
        lastX = e.clientX;
        if (Math.abs(e.clientX - startX) > 6) dragMovedRef.current = true;
      }
    };
    const endDrag = () => {
      dragging = false;
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);

    return () => {
      gsap.ticker.remove(tick);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      root.removeEventListener('pointercancel', endDrag);
      gsap.killTweensOf(ring);
      focusCardRef.current = () => {};
    };
    // Rebuild when the ring's structure changes; live knobs flow through refs.
  }, [itemCount, repeat, rotationOffset]);

  return (
    <div
      ref={rootRef}
      className={cn('relative h-full w-full touch-pan-y select-none overflow-hidden', className)}
      style={{ perspective: '1600px' }}
    >
      <div ref={stageRef} className="absolute inset-0 [transform-style:preserve-3d]">
        {/* Centre preview — inside the 3D scene so the ring passes in front of and behind it */}
        {center ? (
          <div
            className="absolute left-1/2 top-1/2 aspect-[16/10] -translate-x-1/2 -translate-y-1/2"
            style={{ width: 'var(--cg-preview, 360px)' }}
          >
            {center}
          </div>
        ) : null}

        {/* The ring */}
        <div ref={ringRef} className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]">
          {cards.map((k) => {
            const index = k % itemCount;
            const item = items[index];
            const copy = k >= itemCount;
            return (
              <div
                key={k}
                data-ring-item
                className="absolute [transform-style:preserve-3d] will-change-transform"
                style={{
                  width: 'var(--cg-card, 160px)',
                  height: 'calc(var(--cg-card, 160px) * 0.625)',
                  left: 'calc(var(--cg-card, 160px) / -2)',
                  top: 'calc(var(--cg-card, 160px) * -0.3125)',
                }}
              >
                <button
                  type="button"
                  tabIndex={copy ? -1 : undefined}
                  aria-hidden={copy || undefined}
                  aria-label={`${cardLabel}: ${item.title}`}
                  data-cursor="view"
                  data-cursor-label="Open"
                  onClick={() => {
                    if (dragMovedRef.current) {
                      dragMovedRef.current = false;
                      return;
                    }
                    cbRef.current.onSelect?.(item, index);
                  }}
                  onFocus={(e) => {
                    // Keyboard focus only; a mouse press shouldn't spin the ring under the cursor.
                    if (e.currentTarget.matches(':focus-visible')) focusCardRef.current(k);
                  }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') cbRef.current.onHoverChange?.(index);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') cbRef.current.onHoverChange?.(null);
                  }}
                  className="group absolute inset-0 block overflow-hidden border border-line bg-ink-2 text-left [backface-visibility:hidden]"
                >
                  <img
                    src={item.src}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-expo group-hover:scale-[1.06]"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-ink/85 px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-bone">
                    <span className="truncate">{item.title}</span>
                    {item.meta ? <span className="text-ochre">{item.meta}</span> : null}
                  </span>
                  <span data-ring-fog aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
                </button>
                {/* Back of the card, seen through the ring */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center border border-line bg-ink-2 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                  <span className="label">{item.meta ?? item.title}</span>
                  <span data-ring-fog className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edge vignette so the ring fades softly into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_58%,var(--color-ink)_100%)]"
      />
    </div>
  );
}

export default CircularGallery;
