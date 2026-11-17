import { Fragment, useEffect, useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';

/**
 * "Let's build / something / real." — every glyph is its own span.
 * Reveal: chars rise out of per-line masks when scrolled into view.
 * Swell (fine pointers only, while in view): glyphs near the cursor widen and thicken via
 * font-variation-settings (wdth 75→100, wght 500→800). The serif line lifts instead,
 * since Instrument Serif has no variable axes.
 */

const LINES: Array<{ words: string[]; serif?: boolean; className: string }> = [
  { words: ['Let’s', 'build'], className: '' },
  { words: ['something'], className: 'pl-[0.55em] sm:pl-[1.1em]' },
  { words: ['real.'], serif: true, className: 'pl-[1.4em] sm:pl-[2.6em]' },
];

const REST = { wdth: 75, wght: 500 };
const PEAK = { wdth: 100, wght: 800 };
const fvs = (t: number) =>
  `"opsz" 96, "wdth" ${(REST.wdth + (PEAK.wdth - REST.wdth) * t).toFixed(1)}, "wght" ${Math.round(REST.wght + (PEAK.wght - REST.wght) * t)}`;

export default function SwellHeadline() {
  const ref = useRef<HTMLHeadingElement>(null);

  // Reveal
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const lines = gsap.utils.toArray<HTMLElement>('[data-line]', ref.current);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 82%', once: true },
      });
      lines.forEach((line, i) => {
        tl.from(
          line.querySelectorAll('[data-ch]'),
          { yPercent: 118, rotate: 6, duration: 1.3, stagger: 0.028, transformOrigin: '0% 100%' },
          i * 0.11,
        );
      });
    },
    { scope: ref },
  );

  // Cursor swell
  useEffect(() => {
    const root = ref.current;
    if (!root || !isFinePointer() || prefersReducedMotion()) return;

    const glyphs = Array.from(root.querySelectorAll<HTMLElement>('[data-sw]'));
    const serif = glyphs.map((g) => g.dataset.sw === 'serif');
    const cur = new Float32Array(glyphs.length);
    const written = new Float32Array(glyphs.length).fill(-1);
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let inView = false;

    const tick = () => {
      raf = 0;
      const radius = Math.max(140, root.clientWidth * 0.16);
      // read pass
      const rects = glyphs.map((g) => g.getBoundingClientRect());
      // write pass
      let moving = false;
      for (let i = 0; i < glyphs.length; i++) {
        const r = rects[i];
        const dx = px - (r.left + r.width / 2);
        const dy = (py - (r.top + r.height / 2)) * 1.25;
        const d = Math.min(1, Math.hypot(dx, dy) / radius);
        const s = 1 - d;
        const target = s * s * (3 - 2 * s); // smoothstep falloff
        cur[i] += (target - cur[i]) * 0.16;
        if (Math.abs(target - cur[i]) < 0.002) cur[i] = target;
        else moving = true;
        const v = Math.round(cur[i] * 200) / 200;
        if (v === written[i]) continue;
        written[i] = v;
        if (serif[i]) glyphs[i].style.transform = `translateY(${(-9 * v).toFixed(2)}%) skewX(${(-5 * v).toFixed(2)}deg)`;
        else glyphs[i].style.fontVariationSettings = fvs(v);
      }
      if (moving) raf = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      px = e.clientX;
      py = e.clientY;
      schedule();
    };
    const onLeave = () => {
      px = py = -1e5;
      schedule();
    };

    const attach = () => {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', schedule, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    };
    const detach = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', schedule);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === inView) return;
        inView = entry.isIntersecting;
        if (inView) attach();
        else {
          detach();
          onLeave(); // ease everything back to rest
        }
      },
      { rootMargin: '10% 0px' },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      detach();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <h2 ref={ref} className="display text-[clamp(3.25rem,15vw,16rem)] text-bone">
      <span className="sr-only">Let’s build something real.</span>
      {LINES.map((line, li) => (
        <span
          key={li}
          aria-hidden
          data-line
          className={`-mb-[0.14em] block overflow-hidden pt-[0.04em] pr-[0.12em] pb-[0.14em] whitespace-nowrap ${line.className}`}
        >
          {line.words.map((word, wi) => (
            <Fragment key={wi}>
              {wi > 0 && ' '}
              <span className={`inline-block ${line.serif ? 'serif-i text-[1.12em] leading-[0.8] text-ochre' : ''}`}>
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} data-ch className="inline-block will-change-transform">
                    <span
                      data-sw={line.serif ? 'serif' : 'display'}
                      className="inline-block"
                      style={line.serif ? undefined : { fontVariationSettings: fvs(0) }}
                    >
                      {ch}
                    </span>
                  </span>
                ))}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </h2>
  );
}
