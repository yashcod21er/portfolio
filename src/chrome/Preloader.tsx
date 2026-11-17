import { useRef, useState, type ReactNode } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { useSite } from '../lib/store';

const PORTRAIT = '/assets/yash-portrait.webp';
const PANELS = 5;
/** Longest we wait on fonts + portrait before exiting anyway. */
const ASSET_CAP_MS = 1700;
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function loadPortrait() {
  const img = new Image();
  img.src = PORTRAIT;
  return img.decode().catch(() => undefined);
}

/** Wraps a line in an overflow mask so it can slide in/out. */
function Mask({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className ?? ''}`}>
      <span data-pl-in className="block">
        {children}
      </span>
    </span>
  );
}

/**
 * Full-screen ink overlay with an eased 000 → 100 counter. Waits for fonts and the
 * portrait (capped), then lifts in staggered ink + ochre columns and hands off to the hero.
 *
 * Scroll is blocked with capture-phase listeners rather than overflow:hidden so the
 * scrollbar never toggles (which would reflow the hero right as it reveals).
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      let alive = true;

      const block = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };
      const blockKeys = (e: KeyboardEvent) => {
        if (SCROLL_KEYS.has(e.key)) block(e);
      };
      const opts = { capture: true, passive: false } as const;
      window.addEventListener('wheel', block, opts);
      window.addEventListener('touchmove', block, opts);
      window.addEventListener('keydown', blockKeys, opts);
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        window.removeEventListener('wheel', block, opts);
        window.removeEventListener('touchmove', block, opts);
        window.removeEventListener('keydown', blockKeys, opts);
      };

      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);

      const finish = () => {
        if (!alive) return;
        release();
        useSite.getState().setLoaded();
      };

      const count = { v: 0 };
      const render = () => {
        if (countRef.current) countRef.current.textContent = String(Math.round(count.v)).padStart(3, '0');
        if (barRef.current) barRef.current.style.transform = `scaleX(${count.v / 100})`;
      };

      const ready = Promise.all([document.fonts.ready, loadPortrait()]);

      if (prefersReducedMotion()) {
        void Promise.race([ready, wait(350)]).then(() => {
          if (!alive) return;
          count.v = 100;
          render();
          gsap.to(root, {
            autoAlpha: 0,
            duration: 0.2,
            ease: 'none',
            onStart: finish,
            onComplete: () => setGone(true),
          });
        });
        return () => {
          alive = false;
          release();
        };
      }

      const intro = gsap.timeline();
      intro
        .from('[data-pl-in]', { yPercent: 110, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0)
        .to(count, { v: 86, duration: 1.25, ease: 'power2.out', onUpdate: render }, 0.1);

      void Promise.all([Promise.race([ready, wait(ASSET_CAP_MS)]), intro.then()]).then(() => {
        if (!alive) return;
        const out = gsap.timeline({ onComplete: () => alive && setGone(true) });
        out
          .to(count, { v: 100, duration: 0.45, ease: 'power3.inOut', onUpdate: render })
          .to('[data-pl-in]', { yPercent: -110, duration: 0.55, stagger: 0.025, ease: 'power3.in' }, '+=0.1')
          .to(barRef.current, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.55, ease: 'power3.in' }, '<')
          .to('[data-pl-ink]', { yPercent: -100, duration: 1.05, stagger: 0.055, ease: 'expo.inOut' }, '-=0.2')
          .to('[data-pl-ochre]', { yPercent: -100, duration: 1.05, stagger: 0.055, ease: 'expo.inOut' }, '<0.11')
          .call(finish, undefined, '<0.3');
      });

      return () => {
        alive = false;
        release();
      };
    },
    { scope: rootRef },
  );

  if (gone) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[8000]" role="status" aria-busy="true">
      <span className="sr-only">Loading portfolio</span>

      {/* Wipe columns: ochre sits under ink and trails it by a beat */}
      <div aria-hidden="true" className="absolute inset-0 flex">
        {Array.from({ length: PANELS }, (_, i) => (
          <div key={i} className="relative -mr-px h-full flex-1">
            <div data-pl-ochre className="absolute inset-0 bg-ochre" />
            <div data-pl-ink className="absolute inset-0 bg-ink" />
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="gutter absolute inset-0 flex flex-col justify-between pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        <div className="label flex items-start justify-between gap-6">
          <Mask className="text-bone">Yash Hogade — Portfolio 2026</Mask>
          <Mask>Pune, IN</Mask>
        </div>

        <div>
          <div className="flex items-end justify-between gap-6">
            <div className="label flex flex-col gap-2 pb-[0.4em]">
              <Mask>18.5204° N · 73.8567° E</Mask>
              <Mask>IST — UTC+05:30</Mask>
            </div>
            <span className="block overflow-hidden">
              <span
                ref={countRef}
                data-pl-in
                className="block font-mono text-[clamp(72px,17vw,232px)] font-normal leading-[0.86] tracking-[-0.06em] text-bone tabular-nums"
              >
                000
              </span>
            </span>
          </div>
          <div className="mt-5 h-px w-full bg-line">
            <span ref={barRef} className="block h-full origin-left bg-bone" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
