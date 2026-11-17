import { useCallback, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/smooth';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_+=<>*';

/** Mono text scramble: characters cycle through glyphs and resolve left to right. */
export function useScramble<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const raf = useRef(0);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const end = text.length * 2 + 4;
    let out = text.split('');
    const step = () => {
      frame++;
      if (frame % 2 === 0) {
        out = text.split('').map((ch, i) => {
          if (ch === ' ' || frame >= i * 2 + 4) return ch;
          return GLYPHS[(Math.random() * GLYPHS.length) | 0];
        });
        el.textContent = out.join('');
      }
      if (frame < end) raf.current = requestAnimationFrame(step);
      else el.textContent = text;
    };
    raf.current = requestAnimationFrame(step);
  }, [text]);

  useEffect(() => {
    const id = raf;
    return () => cancelAnimationFrame(id.current);
  }, []);

  return { ref, run };
}
