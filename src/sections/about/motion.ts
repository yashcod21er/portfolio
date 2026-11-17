import { gsap, ScrollTrigger } from '../../lib/gsap';

/**
 * Masked rise for every [data-rise] inside `el` (see Mask.tsx). Call inside useGSAP.
 * Uses gsap.from with immediateRender so the resting CSS state is the visible one.
 */
export function riseIn(el: Element, start = 'top 85%', stagger = 0.1) {
  const targets = el.querySelectorAll('[data-rise]');
  if (!targets.length) return;
  gsap.from(targets, {
    yPercent: 120,
    duration: 1.2,
    stagger,
    ease: 'expo.out',
    scrollTrigger: { trigger: el, start, once: true },
  });
}

/**
 * Hairline rows: each row's [data-line] draws left→right, then its [data-rise] text lifts.
 * Rows that enter together are staggered. Call inside useGSAP.
 */
export function revealRows(rows: Element[], start = 'top 90%') {
  if (!rows.length) return;
  rows.forEach((row) => {
    gsap.set(row.querySelectorAll('[data-line]'), { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(row.querySelectorAll('[data-rise]'), { yPercent: 120 });
  });
  ScrollTrigger.batch(rows, {
    start,
    once: true,
    onEnter: (batch) => {
      batch.forEach((row, i) => {
        const tl = gsap.timeline({ delay: i * 0.09 });
        tl.to(row.querySelectorAll('[data-line]'), {
          scaleX: 1,
          duration: 1.3,
          ease: 'expo.inOut',
        }).to(
          row.querySelectorAll('[data-rise]'),
          { yPercent: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out' },
          0.35,
        );
      });
    },
  });
}

/** Debounced global refresh, for layout changes ScrollTrigger can't see (accordion). */
let refreshTimer: number | undefined;
export function queueRefresh(delay = 800) {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay);
}
