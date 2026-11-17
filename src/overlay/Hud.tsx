import { useCallback, useEffect, useRef } from 'react';
import { PuneClock } from '../chrome/PuneClock';
import { scrollToTarget } from '../lib/smooth';
import { sfx } from '../lib/sound';
import { useSite } from '../lib/store';
import { CHAPTERS } from '../world/layout';
import { useWorld } from '../world/store';
import { chapterStart, pad2, PUNE_COORDS, useGlobalVar } from './useChapter';

/**
 * The camera viewfinder over everything: corner brackets, faint scanlines with a slow sweep,
 * chapter counter (bottom-left), scroll readout (bottom-right), coordinates + IST clock
 * (top-right, under the nav) and a clickable chapter rail (right edge, md+).
 * Pointer events are off except on the rail ticks.
 */
export default function Hud() {
  const loaded = useSite((s) => s.loaded);
  const index = useWorld((s) => s.chapterIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  const onWrite = useCallback((p: number) => {
    if (pctRef.current) pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, '0');
  }, []);
  useGlobalVar(rootRef, onWrite);

  const chapter = CHAPTERS[index] ?? CHAPTERS[0];
  const atEnd = chapter.id === 'contact';
  const inset = 'clamp(10px,1.6vw,22px)';

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-1000 ease-expo"
      style={{ opacity: loaded ? 1 : 0 }}
    >
      {/* scanlines + slow sweep */}
      <div aria-hidden="true" className="scanlines absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="ov-scan-bar absolute inset-x-0 top-0 h-[10vh] bg-[linear-gradient(to_bottom,transparent,rgb(255_42_31/0.035),transparent)]"
      />

      {/* viewfinder corners */}
      <div aria-hidden="true" className="brackets absolute opacity-80" style={{ inset }}>
        <i />
        <i />
        <i />
        <i />
      </div>

      {/* top-right: where + when */}
      <div
        aria-hidden="true"
        className="label absolute right-[max(var(--gutter),env(safe-area-inset-right,0px))] top-[max(76px,calc(env(safe-area-inset-top,0px)+64px))] hidden text-right text-[10px] md:block"
      >
        <span className="block">{PUNE_COORDS}</span>
        <PuneClock className="mt-1 block text-bone/80" />
      </div>

      {/* bottom-left: chapter counter */}
      <div
        aria-hidden="true"
        className="label absolute bottom-[max(26px,calc(env(safe-area-inset-bottom,0px)+18px))] left-[max(var(--gutter),env(safe-area-inset-left,0px))] flex items-center gap-2.5 text-bone transition-opacity duration-500"
        style={{ opacity: atEnd ? 0 : 1 }}
      >
        <span className="signal-dot" />
        <span className="tabular-nums">
          <span className="text-signal">{pad2(index + 1)}</span> / {pad2(CHAPTERS.length)}
        </span>
        <span aria-hidden="true" className="h-px w-5 bg-signal/60" />
        <span>{chapter.label}</span>
      </div>

      {/* bottom-right: signal meter + scroll readout */}
      <div
        aria-hidden="true"
        className="label absolute bottom-[max(26px,calc(env(safe-area-inset-bottom,0px)+18px))] right-[max(var(--gutter),env(safe-area-inset-right,0px))] flex items-center gap-4 transition-opacity duration-500"
        style={{ opacity: atEnd ? 0 : 1 }}
      >
        <SignalMeter />
        <span className="hidden items-center gap-2 sm:flex">
          <span className="text-signal">Rec</span>
          <span ref={pctRef} className="tabular-nums text-bone">
            000
          </span>
          %
        </span>
      </div>

      {/* right rail: progress + chapter ticks */}
      <nav
        aria-label="Chapters"
        className="absolute right-[max(var(--gutter),env(safe-area-inset-right,0px))] top-1/2 hidden h-[44vh] w-6 -translate-y-1/2 md:block"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
        <span
          aria-hidden="true"
          className="ov-hud-fill absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-signal shadow-[0_0_8px_var(--color-signal)]"
        />
        <span
          aria-hidden="true"
          className="ov-hud-head absolute left-1/2 block size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_10px_var(--color-signal)]"
        />
        <ol>
          {CHAPTERS.map((c, i) => {
            const on = i === index;
            return (
              <li key={c.id} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: `${chapterStart(c.id) * 100}%` }}>
                <button
                  type="button"
                  aria-label={`Go to ${c.label}`}
                  aria-current={on ? 'step' : undefined}
                  onPointerEnter={() => sfx.hover()}
                  onClick={() => {
                    sfx.click();
                    scrollToTarget(`#${c.id}`);
                  }}
                  className="group pointer-events-auto relative grid size-6 place-items-center"
                >
                  <span
                    className={`block h-px transition-[width,background-color] duration-500 ease-expo ${on ? 'w-4 bg-signal' : 'w-2.5 bg-bone/50 group-hover:w-4 group-hover:bg-bone'}`}
                  />
                  <span
                    className={`label pointer-events-none absolute right-full mr-2 whitespace-nowrap text-[10px] transition-opacity duration-300 ${on ? 'text-signal opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
                  >
                    {pad2(i + 1)} {c.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

const BARS = 5;

/**
 * A tiny live "SIGNAL" meter: five bars that climb with scroll speed and settle back to one
 * when the page rests (with a faint idle flutter). Runs on its own rAF from the store's
 * progress, so it works without WebGL; updates the DOM only when the level changes.
 */
function SignalMeter() {
  const barsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = barsRef.current;
    if (!root) return;
    const bars = Array.from(root.children) as HTMLElement[];
    let raf = 0;
    let lastT = performance.now();
    let lastP = useWorld.getState().progress;
    let level = 0;
    let shown = -1;
    let flutter = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(Math.max((now - lastT) / 1000, 1e-3), 0.1);
      lastT = now;
      const p = useWorld.getState().progress;
      const speed = Math.abs(p - lastP) / dt;
      lastP = p;
      const target = Math.min(1, speed / 0.12);
      // fast attack, slow release, like a VU meter
      level += (target - level) * (1 - Math.exp(-dt * (target > level ? 14 : 2.6)));
      // idle flutter: now and then the second bar catches a stray signal
      if (Math.random() < dt * 0.6) flutter = 0.35 + Math.random() * 0.3;
      flutter *= Math.exp(-dt * 5);
      const lit = Math.min(BARS, 1 + Math.floor(Math.max(level, flutter * 0.3) * BARS + 0.15));
      if (lit !== shown) {
        shown = lit;
        bars.forEach((b, i) => {
          b.dataset.on = i < lit ? '1' : '0';
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="flex items-center gap-2">
      <span className="text-bone/70">Signal</span>
      <span ref={barsRef} className="ov-meter flex h-[11px] items-end gap-[2px]">
        {Array.from({ length: BARS }, (_, i) => (
          <i key={i} data-on={i === 0 ? '1' : '0'} style={{ height: `${36 + i * 16}%` }} />
        ))}
      </span>
    </span>
  );
}
