import { useEffect } from 'react';
import { create } from 'zustand';
import { CHAPTERS, type ChapterId } from '../world/layout';

/** Page sections in order: the overlay's chapter sections (ids double as nav anchors). */
export const SECTIONS: ReadonlyArray<{ id: ChapterId; label: string }> = CHAPTERS.map((c) => ({ id: c.id, label: c.label }));

export type SectionId = ChapterId;

interface SpyState {
  /** id of the section crossing the viewport's middle line */
  active: SectionId;
}

export const useSectionSpy = create<SpyState>(() => ({ active: 'intro' }));

let users = 0;
let teardown: (() => void) | null = null;

function start() {
  let raf = 0;
  const measure = () => {
    raf = 0;
    const mid = window.innerHeight * 0.5;
    let active: SectionId = 'intro';
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= mid) active = s.id;
    }
    if (useSectionSpy.getState().active !== active) useSectionSpy.setState({ active });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(measure);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}

/** Subscribe to the active section; one shared scroll listener however many components use it. */
export function useActiveSection(): SectionId {
  useEffect(() => {
    users++;
    if (users === 1) teardown = start();
    return () => {
      users--;
      if (users === 0) {
        teardown?.();
        teardown = null;
      }
    };
  }, []);
  return useSectionSpy((s) => s.active);
}
