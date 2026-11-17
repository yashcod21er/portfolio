import { useEffect } from 'react';
import { create } from 'zustand';

/** Page sections in order (DESIGN.md "Page order"). Missing ones are skipped. */
export const SECTIONS = [
  { id: 'home', label: 'Index' },
  { id: 'work', label: 'Work' },
  { id: 'interlude', label: 'Interlude' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

interface SpyState {
  /** id of the section crossing the viewport's middle line */
  active: SectionId;
}

export const useSectionSpy = create<SpyState>(() => ({ active: 'home' }));

let users = 0;
let teardown: (() => void) | null = null;

function start() {
  let raf = 0;
  const measure = () => {
    raf = 0;
    const mid = window.innerHeight * 0.5;
    let active: SectionId = 'home';
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
