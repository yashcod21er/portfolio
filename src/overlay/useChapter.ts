import { useEffect, useRef, useState, type RefObject } from 'react';
import { CHAPTER_RANGES, chapterLocal, type ChapterId } from '../world/layout';
import { useWorld } from '../world/store';
import { useSite } from '../lib/store';

/**
 * Writes the chapter's local progress (0..1, same mapping the camera uses) to `--p` on the
 * element. No React re-renders: CSS reads the variable for fades and parallax.
 */
export function useChapterVar(id: ChapterId, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    const write = (p: number) => {
      const v = Math.round(chapterLocal(id, p) * 1000) / 1000;
      if (v === last) return;
      last = v;
      el.style.setProperty('--p', String(v));
    };
    write(useWorld.getState().progress);
    return useWorld.subscribe((s) => write(s.progress));
  }, [id, ref]);
}

/** Overall progress (0..1) written to `--g` on the element. */
export function useGlobalVar(ref: RefObject<HTMLElement | null>, onWrite?: (p: number) => void) {
  const cb = useRef(onWrite);
  useEffect(() => {
    cb.current = onWrite;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    const write = (p: number) => {
      const v = Math.round(p * 1000) / 1000;
      if (v === last) return;
      last = v;
      el.style.setProperty('--g', String(v));
      cb.current?.(v);
    };
    write(useWorld.getState().progress);
    return useWorld.subscribe((s) => write(s.progress));
  }, [ref]);
}

/**
 * Which of `count` equal segments of the chapter the camera is in. Re-renders only when the
 * segment changes.
 */
export function useSegment(id: ChapterId, count: number) {
  return useWorld((s) => Math.min(count - 1, Math.floor(chapterLocal(id, s.progress) * count)));
}

/** Where a chapter starts in overall progress (HUD rail ticks). */
export const chapterStart = (id: ChapterId) => CHAPTER_RANGES[id][0];

/**
 * True once the preloader has handed off, or after a safety timeout, so text that waits for
 * the intro can never stay hidden.
 */
export function useRevealReady(timeoutMs = 6000) {
  const loaded = useSite((s) => s.loaded);
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const id = window.setTimeout(() => setLate(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [loaded, timeoutMs]);
  return loaded || late;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Pune, for the HUD and the footer. */
export const PUNE_COORDS = '18.5204° N · 73.8567° E';
