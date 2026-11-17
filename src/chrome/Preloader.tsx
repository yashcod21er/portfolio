import { useRef, useState, type ReactNode } from 'react';
import { portfolioConfig as cfg } from '../data/portfolioConfig';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/smooth';
import { useSite } from '../lib/store';
import { useWorld } from '../world/store';

const PORTRAIT = '/assets/yash-portrait.webp';
/** Longest we wait on fonts, portrait and the first rendered 3D frames before exiting anyway. */
const ASSET_CAP_MS = 4000;
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp']);

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Resolves once the 3D world has compiled and drawn its first frames (or has no WebGL). */
function sceneReady() {
  return new Promise<void>((resolve) => {
    const done = () => {
      const s = useWorld.getState();
      return s.sceneReady || !s.webgl;
    };
    if (done()) return resolve();
    const unsub = useWorld.subscribe(() => {
      if (!done()) return;
      unsub();
      resolve();
    });
  });
}

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
 * Black screen, a red 000 → 100 counter and "acquiring signal" status. Waits for fonts and the
 * portrait (capped), flips to "SIGNAL ACQUIRED", then a glowing red scanline sweeps down and
 * peels the black away from the top, revealing the world.
 *
 * Scroll is blocked with capture-phase listeners rather than overflow:hidden so the
 * scrollbar never toggles (which would reflow the page right as it reveals).
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

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
      const acquired = () => {
        if (statusRef.current) statusRef.current.textContent = 'Signal acquired';
      };

      const ready = Promise.all([document.fonts.ready, loadPortrait(), sceneReady()]);

      if (prefersReducedMotion()) {
        void Promise.race([ready, wait(350)]).then(() => {
          if (!alive) return;
          count.v = 100;
          render();
          acquired();
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
        .to(count, { v: 86, duration: 1.25, ease: 'power2.out', onUpdate: render }, 0.1)
        // while the world compiles, keep creeping so it never looks stuck
        .to(count, { v: 97, duration: 2.6, ease: 'power1.out', onUpdate: render });

      const introDone = wait(1350);
      void Promise.all([Promise.race([ready, wait(ASSET_CAP_MS)]), introDone]).then(() => {
        if (!alive) return;
        // The scanline sits at `y`% from the top; everything above it is already revealed.
        const sweep = { y: 0 };
        const paint = () => {
          if (sheetRef.current) sheetRef.current.style.clipPath = `inset(${sweep.y}% 0% 0% 0%)`;
          if (lineRef.current) lineRef.current.style.transform = `translate3d(0, ${sweep.y}vh, 0)`;
        };
        intro.kill();
        const out = gsap.timeline({ onComplete: () => alive && setGone(true) });
        out
          .to(count, { v: 100, duration: 0.45, ease: 'power3.inOut', onUpdate: render })
          .call(acquired)
          // a two-frame flicker on the counter as the signal locks
          .to(countRef.current, { opacity: 0.25, duration: 0.05, repeat: 3, yoyo: true, ease: 'none' })
          .to('[data-pl-in]', { yPercent: -110, duration: 0.5, stagger: 0.02, ease: 'power3.in' }, '+=0.25')
          .to(barRef.current, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.5, ease: 'power3.in' }, '<')
          .set(lineRef.current, { autoAlpha: 1 })
          .to(sweep, { y: 100, duration: 1.15, ease: 'power3.inOut', onUpdate: paint })
          .call(finish, undefined, '<0.25')
          .to(lineRef.current, { autoAlpha: 0, duration: 0.2 });
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
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-[8000]" role="status" aria-busy="true">
      <span className="sr-only">Loading portfolio</span>

      {/* The black sheet that gets peeled away by the scanline */}
      <div ref={sheetRef} aria-hidden="true" className="pointer-events-auto absolute inset-0 bg-ink">
        <div className="scanlines absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgb(143_13_10/0.4)_0%,transparent_60%)]" />

        <div className="gutter absolute inset-0 flex flex-col justify-between pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="label flex items-start justify-between gap-6">
            <Mask className="text-bone">
              {cfg.name} — Portfolio {cfg.copyrightYear}
            </Mask>
            <Mask>
              <span className="text-signal">●</span> {cfg.systemVersion}
            </Mask>
          </div>

          <div>
            <div className="flex items-end justify-between gap-6">
              <div className="label flex flex-col gap-2 pb-[0.5em]">
                <Mask>
                  <span ref={statusRef} className="text-signal">
                    Acquiring signal
                  </span>
                </Mask>
                <Mask>18.5204° N · 73.8567° E</Mask>
                <Mask>IST — UTC+05:30</Mask>
              </div>
              <span className="block overflow-hidden">
                <span
                  ref={countRef}
                  data-pl-in
                  className="glow block font-mono text-[clamp(72px,17vw,232px)] font-normal leading-[0.86] tracking-[-0.06em] text-signal tabular-nums"
                >
                  000
                </span>
              </span>
            </div>
            <div className="mt-5 h-px w-full bg-line">
              <span
                ref={barRef}
                className="block h-full origin-left bg-signal shadow-[0_0_10px_var(--color-signal)]"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* The scanline itself */}
      <div
        ref={lineRef}
        aria-hidden="true"
        className="invisible absolute inset-x-0 top-0 h-[2px] -translate-y-1/2 bg-signal shadow-[0_0_18px_3px_var(--color-signal),0_0_60px_8px_rgb(255_42_31/0.45)]"
      />
    </div>
  );
}
