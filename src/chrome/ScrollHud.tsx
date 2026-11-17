import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useSite } from '../lib/store';
import { ProgressCounter, ProgressRing } from '../vendor/skiper/skiper89';
import { SECTIONS, useActiveSection } from './sectionSpy';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Bottom-right mono readout (md and up): ring · "02 Work" · "064%", over a hairline track
 * with an ochre fill. Purely informational (aria-hidden, no pointer events). Fades in after
 * the preloader and steps aside while the footer (anything marked [data-hud-hide]) is in view.
 */
export default function ScrollHud() {
  const loaded = useSite((s) => s.loaded);
  const active = useActiveSection();
  // Lenis drives native scroll, so motion's window scroll tracking just works.
  const { scrollYProgress } = useScroll();
  const progress = useTransform(scrollYProgress, (v) => Math.min(Math.max(v, 0), 1));
  const reduce = useReducedMotion();
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll('[data-hud-hide]');
    if (!targets.length) return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setCovered(seen.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [loaded]);

  const index = Math.max(0, SECTIONS.findIndex((s) => s.id === active));
  const label = SECTIONS[index]?.label ?? '';
  const shown = loaded && !covered;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-[max(var(--gutter),env(safe-area-inset-right,0px))] bottom-[max(18px,env(safe-area-inset-bottom))] z-[60] hidden w-[224px] font-mono text-[11px] tracking-[0.12em] text-bone uppercase transition-[opacity,translate] duration-700 ease-expo md:block"
      style={{ opacity: shown ? 1 : 0, translate: shown ? '0 0' : '0 8px' }}
    >
      <div className="flex items-center gap-2.5">
        <ProgressRing progress={progress} className="size-4 shrink-0 text-bone" radius={17} strokeWidth={5} />
        <span className="tabular-nums text-mute">{String(index + 1).padStart(2, '0')}</span>
        <span className="relative block h-[1.3em] min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={label}
              className="absolute inset-0 block leading-[1.3em]"
              initial={reduce ? { opacity: 0 } : { y: '110%' }}
              animate={reduce ? { opacity: 1 } : { y: '0%' }}
              exit={reduce ? { opacity: 0 } : { y: '-110%' }}
              transition={{ duration: reduce ? 0.15 : 0.6, ease: EXPO }}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
        <ProgressCounter progress={progress} className="text-bone" />
      </div>
      <div className="mt-2 h-px w-full bg-bone/15">
        <motion.span className="block h-full origin-left bg-ochre" style={{ scaleX: progress }} />
      </div>
    </div>
  );
}
