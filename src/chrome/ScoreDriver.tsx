import { useEffect } from 'react';
import { setScore, useSound } from '../lib/sound';
import { CHAPTERS } from '../world/layout';
import { useWorld } from '../world/store';

const BASE_TITLE = document.title;
/** progress-per-second that counts as "full speed" for the score */
const FULL_SPEED = 0.35;

/**
 * Feeds the world into the chrome:
 * - the ambient score follows the current chapter and how fast the visitor is flying
 *   (only while sound is actually playing);
 * - the tab title names the chapter, and says the signal is lost while the tab is hidden.
 * Renders nothing.
 */
export default function ScoreDriver() {
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastP = useWorld.getState().progress;
    let energy = 0;

    const tick = (now: number) => {
      const dt = Math.max(0.001, (now - last) / 1000);
      const { progress, chapterIndex } = useWorld.getState();
      const speed = Math.abs(progress - lastP) / dt / FULL_SPEED;
      last = now;
      lastP = progress;
      // fast attack, slow release, so a flick of the wheel swells and then settles
      const k = speed > energy ? 0.35 : 0.04;
      energy += (Math.min(1, speed) - energy) * k;
      setScore({ chapter: chapterIndex, energy });
      raf = requestAnimationFrame(tick);
    };

    const sync = (playing: boolean) => {
      cancelAnimationFrame(raf);
      if (playing) {
        last = performance.now();
        lastP = useWorld.getState().progress;
        raf = requestAnimationFrame(tick);
      }
    };
    sync(useSound.getState().playing);
    const unsub = useSound.subscribe((s, prev) => {
      if (s.playing !== prev.playing) sync(s.playing);
    });
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, []);

  useEffect(() => {
    const titleFor = (i: number) =>
      i <= 0 ? BASE_TITLE : `${CHAPTERS[i]?.label ?? ''} — Yash Hogade`;
    const apply = () => {
      document.title = document.hidden ? '● Signal lost — Yash Hogade' : titleFor(useWorld.getState().chapterIndex);
    };
    const unsub = useWorld.subscribe((s, prev) => {
      if (s.chapterIndex !== prev.chapterIndex) apply();
    });
    document.addEventListener('visibilitychange', apply);
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', apply);
      document.title = BASE_TITLE;
    };
  }, []);

  return null;
}
