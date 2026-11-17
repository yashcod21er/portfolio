import { useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import { gsap, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import Gallery from './Gallery';
import WorkIndex from './WorkIndex';
import { EASE_EXPO, pad, projects, refreshScroll, yearRange } from './projectUtils';
import './work.css';

type View = 'gallery' | 'index';

const VIEWS: { id: View; label: string }[] = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'index', label: 'Index' },
];

export default function Work() {
  const [view, setView] = useState<View>('gallery');
  const headerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const header = headerRef.current;
      if (!header) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: header, start: 'top 78%', once: true } });
      tl.from('[data-hairline]', { scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: 'expo.inOut' })
        .from('[data-line]', { yPercent: 108, duration: 1.3, stagger: 0.11 }, 0.15)
        .from('[data-head-rise]', { y: 20, opacity: 0, stagger: 0.08 }, 0.55);
    },
    { scope: headerRef },
  );

  const afterSwap = () => {
    // Motion leaves an identity transform; make sure the pinned track never sits inside one.
    if (viewRef.current) viewRef.current.style.transform = 'none';
    requestAnimationFrame(refreshScroll);
  };

  return (
    <section id="work" aria-labelledby="work-title" className="relative bg-ink pb-[clamp(6rem,14vw,12rem)] pt-[clamp(7rem,16vw,14rem)]">
      <div ref={headerRef} className="gutter mx-auto max-w-[1600px]">
        <div className="relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-5">
          <span data-hairline aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
          <span data-head-rise className="label inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ochre" />
            Work
          </span>
          <span data-head-rise className="label tabular-nums">
            {pad(projects.length)} projects
          </span>
          <span data-head-rise className="label tabular-nums">
            Archive · {yearRange()}
          </span>
        </div>

        <h2 id="work-title" className="display mt-[clamp(1.5rem,4vw,3rem)] text-[clamp(4.25rem,17.5vw,17rem)]">
          <span className="block overflow-clip pb-[0.04em]">
            <span data-line className="inline-block">
              Selected
              <sup className="ml-[0.12em] align-top font-mono text-[length:max(11px,0.07em)] font-normal tracking-[0.1em] text-mute">
                ({pad(projects.length)})
              </sup>
            </span>
          </span>
          <span className="-mt-[0.06em] block overflow-clip pb-[0.08em] pl-[0.55em]">
            <span data-line className="serif-i inline-block pr-[0.08em] text-[1.06em] leading-[0.9]">
              work
            </span>
          </span>
        </h2>

        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid gap-8 lg:grid-cols-12 lg:items-end">
          <p data-head-rise className="max-w-[46ch] text-[17px] leading-relaxed text-bone/80 lg:col-span-5">
            Things I have designed and built end to end — a server-rendered stays marketplace, a vanilla-JS
            music player, a trading dashboard recreation and a streaming AI assistant. Open any of them for
            the problem, the approach and the architecture behind it.
          </p>
          <div data-head-rise className="flex items-center gap-4 lg:col-span-7 lg:justify-end">
            <span className="label hidden sm:inline">View</span>
            <LayoutGroup id="work-view">
              <div role="group" aria-label="Work view" className="inline-flex items-center rounded-full border border-line p-1">
                {VIEWS.map((v) => {
                  const active = view === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={active}
                      data-cursor="link"
                      onClick={() => setView(v.id)}
                      className={
                        'relative rounded-full px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 ' +
                        (active ? 'text-ink' : 'text-mute hover:text-bone')
                      }
                    >
                      {active && (
                        <motion.span
                          layoutId="work-view-pill"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-bone"
                          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                        />
                      )}
                      <span className="relative">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(3.5rem,8vw,7rem)]">
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" initial={false} onExitComplete={() => requestAnimationFrame(refreshScroll)}>
            <motion.div
              key={view}
              ref={viewRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_EXPO } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] } }}
              onAnimationComplete={afterSwap}
            >
              {view === 'gallery' ? <Gallery /> : <WorkIndex />}
            </motion.div>
          </AnimatePresence>
        </MotionConfig>
      </div>
    </section>
  );
}
