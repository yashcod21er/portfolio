import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { SpringFollow } from '../vendor/skiper/skiper61';

type Mode = 'default' | 'link' | 'view' | 'hide';

/** Native interactive elements get the "link" state without opting in. */
const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], summary, select, label[for]';

const canUseCursor = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function resolve(target: EventTarget | null): { mode: Mode; label: string } {
  const el = target instanceof Element ? target : null;
  if (!el) return { mode: 'default', label: '' };
  const tagged = el.closest<HTMLElement>('[data-cursor]');
  if (tagged) {
    const m = tagged.dataset.cursor;
    if (m === 'view') return { mode: 'view', label: tagged.dataset.cursorLabel || 'View' };
    if (m === 'hide') return { mode: 'hide', label: '' };
    if (m === 'link') return { mode: 'link', label: '' };
  }
  if (el.closest(INTERACTIVE)) return { mode: 'link', label: '' };
  return { mode: 'default', label: '' };
}

/**
 * Global cursor (fine pointers only). Contract, see DESIGN.md:
 *  data-cursor="link"                         → red ring grows, fills with a faint red glow
 *  data-cursor="view" data-cursor-label="Open" → glowing signal-red disc with mono label
 *  data-cursor="hide"                         → hidden
 * Uses document-level pointerover delegation, so any section opts in with attributes only.
 */
export default function Cursor() {
  const [enabled] = useState(canUseCursor);
  const [trail] = useState(() => !prefersReducedMotion());
  const [label, setLabel] = useState('View');
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const fill = fillRef.current;
    const disc = discRef.current;
    const layer = layerRef.current;
    if (!dot || !ring || !fill || !disc || !layer) return;

    const html = document.documentElement;
    html.classList.add('has-cursor');

    const reduce = prefersReducedMotion();
    const all = [dot, ring, disc];
    gsap.set(all, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    gsap.set(disc, { scale: 0 });
    gsap.set(fill, { scale: 0 });

    const follow = (el: HTMLElement, duration: number) => ({
      x: gsap.quickTo(el, 'x', { duration, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration, ease: 'power3.out' }),
    });
    const dotTo = follow(dot, 0.12);
    const ringTo = follow(ring, reduce ? 0.12 : 0.5);
    const discTo = follow(disc, reduce ? 0.12 : 0.6);

    let mode: Mode = 'default';
    let current = '';
    let shown = false;
    let pressed = false;

    const apply = () => {
      const d = 0.5;
      const ease = 'expo.out';
      gsap.to(dot, { scale: mode === 'default' ? 1 : 0, duration: d, ease, overwrite: 'auto' });
      gsap.to(ring, {
        scale: mode === 'link' ? (pressed ? 1.5 : 1.85) : mode === 'default' ? (pressed ? 0.75 : 1) : 0.2,
        opacity: mode === 'link' || mode === 'default' ? 1 : 0,
        duration: d,
        ease,
        overwrite: 'auto',
      });
      gsap.to(fill, { scale: mode === 'link' ? 1 : 0, duration: d, ease, overwrite: 'auto' });
      // The spring bead (skiper61) only trails the plain cursor; it ducks out for link/view/hide.
      if (trailRef.current) {
        gsap.to(trailRef.current, { autoAlpha: mode === 'default' ? 0.85 : 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      }
      gsap.to(disc, {
        scale: mode === 'view' ? (pressed ? 0.9 : 1) : 0,
        duration: mode === 'view' ? 0.6 : 0.35,
        ease: mode === 'view' ? 'expo.out' : 'power3.out',
        overwrite: 'auto',
      });
    };

    const show = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      // visibility on a static wrapper hides everything without isolating the blend modes
      layer.style.visibility = on ? 'visible' : 'hidden';
    };

    const isMouse = (e: PointerEvent) => e.pointerType === 'mouse' || e.pointerType === 'pen';

    const onMove = (e: PointerEvent) => {
      if (!isMouse(e)) return;
      if (!shown) {
        gsap.set(all, { x: e.clientX, y: e.clientY });
        show(true);
      }
      dotTo.x(e.clientX);
      dotTo.y(e.clientY);
      ringTo.x(e.clientX);
      ringTo.y(e.clientY);
      discTo.x(e.clientX);
      discTo.y(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      if (!isMouse(e)) return;
      const next = resolve(e.target);
      if (next.mode === mode && next.label === current) return;
      mode = next.mode;
      current = next.label;
      if (next.mode === 'view') setLabel(next.label);
      apply();
    };

    const onDown = (e: PointerEvent) => {
      if (!isMouse(e)) return;
      pressed = true;
      apply();
    };
    const onUp = () => {
      if (!pressed) return;
      pressed = false;
      apply();
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) show(false);
    };
    const onBlur = () => show(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('mouseout', onOut);
    window.addEventListener('blur', onBlur);

    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('blur', onBlur);
      gsap.killTweensOf([dot, ring, fill, disc]);
    };
  }, [enabled]);

  if (!enabled) return null;

  // Each piece is its own fixed, z-indexed element; the wrapper stays static (no z-index,
  // opacity or transform) so visibility can hide everything without a stacking context.
  return (
    <div ref={layerRef} aria-hidden="true" style={{ visibility: 'hidden' }}>
      {trail && <SpringFollow ref={trailRef} size={4} className="bg-signal/70" />}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-9 w-9 rounded-full border border-signal/80 shadow-[0_0_14px_-2px_var(--color-signal)] will-change-transform"
      >
        <div ref={fillRef} className="absolute inset-0 rounded-full bg-signal/20" />
        <span aria-hidden="true" className="absolute left-1/2 top-[-5px] h-[4px] w-px -translate-x-1/2 bg-signal" />
        <span aria-hidden="true" className="absolute bottom-[-5px] left-1/2 h-[4px] w-px -translate-x-1/2 bg-signal" />
        <span aria-hidden="true" className="absolute left-[-5px] top-1/2 h-px w-[4px] -translate-y-1/2 bg-signal" />
        <span aria-hidden="true" className="absolute right-[-5px] top-1/2 h-px w-[4px] -translate-y-1/2 bg-signal" />
      </div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[10001] h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_var(--color-signal)] will-change-transform"
      />
      <div
        ref={discRef}
        className="pointer-events-none fixed left-0 top-0 z-[10002] flex h-[92px] w-[92px] items-center justify-center rounded-full bg-signal shadow-[0_0_40px_-6px_var(--color-signal)] will-change-transform"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">{label}</span>
      </div>
    </div>
  );
}
