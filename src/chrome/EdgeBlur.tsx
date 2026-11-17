import { useEffect, useRef, useState } from 'react';
import { ProgressiveBlur } from '../vendor/skiper/skiper41';

const TINT = 'rgb(11 13 14 / 0.62)'; // ink

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

/**
 * Fixed progressive-blur bands at the top and bottom of the viewport (z 60, under the nav),
 * so content dissolves softly under the bar and into the bottom edge.
 *
 * The bands slide out (transform, never opacity: an opacity < 1 ancestor would become the
 * backdrop root and kill the blur) when they'd only get in the way: the top band at the very
 * top of the page (the hero portrait stays crisp), the bottom band at the end of the page
 * (the footer wordmark stays crisp). Skipped entirely under prefers-reduced-transparency.
 */
export default function EdgeBlur() {
  const [enabled] = useState(() => !query('(prefers-reduced-transparency: reduce)'));
  const [light] = useState(() => query('(pointer: coarse)') || query('(max-width: 767px)'));
  const topRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let topOn: boolean | null = null;
    let botOn: boolean | null = null;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = y > 24;
      const b = max - y > 140;
      if (t !== topOn && topRef.current) {
        topOn = t;
        topRef.current.style.transform = t ? 'translateY(0)' : 'translateY(-101%)';
      }
      if (b !== botOn && botRef.current) {
        botOn = b;
        botRef.current.style.transform = b ? 'translateY(0)' : 'translateY(101%)';
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [enabled]);

  if (!enabled) return null;

  const band = 'z-[60] transition-transform duration-700 ease-expo will-change-transform';
  return (
    <>
      <ProgressiveBlur
        ref={topRef}
        fixed
        position="top"
        height={light ? '64px' : '80px'}
        blurAmount={light ? 3 : 6}
        layers={light ? 1 : 3}
        backgroundColor={TINT}
        className={band}
        style={{ transform: 'translateY(-101%)' }}
      />
      <ProgressiveBlur
        ref={botRef}
        fixed
        position="bottom"
        height={light ? '64px' : '90px'}
        blurAmount={light ? 3 : 6}
        layers={light ? 1 : 3}
        backgroundColor={TINT}
        className={band}
      />
    </>
  );
}
