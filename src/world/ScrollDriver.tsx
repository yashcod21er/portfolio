import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import { useWorld } from './store';

/**
 * Turns page scroll into world progress (0..1) and tracks the pointer. Lenis drives
 * ScrollTrigger, so this stays in sync with smooth scrolling. Renders nothing.
 */
export default function ScrollDriver() {
  useEffect(() => {
    const { setProgress, setPointer } = useWorld.getState();
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => setProgress(self.progress),
    });
    setProgress(st.progress);

    const onMove = (e: PointerEvent) => {
      setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    const onLeave = () => setPointer(0, 0);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      st.kill();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return null;
}
