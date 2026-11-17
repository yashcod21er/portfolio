import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { sfx } from '../lib/sound';
import { useSite } from '../lib/store';
import { projects, splitTitle } from '../sections/work/projectUtils';
import { chapterLocal } from '../world/layout';
import { useWorld } from '../world/store';
import { activeWorkIndex, WORK_COUNT } from '../world/chapters/workStops';
import { pad2, useChapterVar } from './useChapter';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Chapter 02 — Work. A left-edge index of the four projects; the row matching the screen the
 * camera is passing lights up red. Rows (and the CTA) open the case study.
 */
export default function WorkChapter() {
  // the same choreography the 3D screens use: the row lit is the screen docked in view
  const active = useWorld((s) => activeWorkIndex(chapterLocal('work', s.progress)));
  const setActiveProject = useSite((s) => s.setActiveProject);
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  useChapterVar('work', stageRef);
  const current = projects[active];

  const open = (slug: string) => {
    sfx.click();
    setActiveProject(slug);
  };

  return (
    <div ref={stageRef} className="ov-stage flex flex-col justify-end md:justify-center">
      {/* side shade so the list reads over the corridor */}
      <div
        aria-hidden="true"
        className="ov-work-shade pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgb(7_5_6/0.88)_0%,rgb(7_5_6/0.62)_34%,transparent_62%)] md:w-[70%]"
      />

      <div className="relative w-full max-w-[500px]">
        <p className="label flex items-center gap-2.5">
          <span className="text-signal">02</span>
          <span aria-hidden="true" className="h-px w-6 bg-signal/60" />
          Selected work
        </p>
        <h2 className="display-x mt-4 text-[clamp(1.9rem,3.5vw,3.4rem)] leading-[0.9]">
          Real products. <span className="glow text-signal">Shipped</span> end to end.
        </h2>

        <ol className="mt-[clamp(1.25rem,3vh,2.25rem)] border-t border-line">
          {projects.map((p, i) => {
            const on = i === active;
            const { main } = splitTitle(p.title);
            return (
              <li key={p.slug} className="border-b border-line">
                <button
                  type="button"
                  data-project-link={p.slug}
                  aria-current={on ? 'true' : undefined}
                  aria-label={`${p.title}, ${p.category}. Open case study`}
                  onClick={() => open(p.slug)}
                  onPointerEnter={() => sfx.hover()}
                  className="ov-work-item relative grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-baseline gap-2 py-[clamp(0.55rem,1.4vh,0.95rem)] pl-3 text-left"
                >
                  <span
                    aria-hidden="true"
                    className="ov-work-item__bar absolute inset-y-1 left-0 w-[2px] bg-signal shadow-[0_0_12px_var(--color-signal)]"
                  />
                  <span className={`font-mono text-[11px] tabular-nums transition-colors duration-300 ${on ? 'text-signal' : 'text-mute'}`}>
                    {pad2(i + 1)}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`ov-work-item__title block truncate font-display text-[clamp(1.15rem,1.9vw,1.6rem)] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] ${on ? 'text-bone' : 'text-bone/45'}`}
                    >
                      {main}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10.5px] uppercase tracking-[0.1em] text-mute">
                      {p.category}
                      <span className="hidden sm:inline"> · {p.technologies.slice(0, 3).join(' · ')}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-[clamp(1rem,2.6vh,1.75rem)] min-h-[6.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.slug}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0.15 : 0.45, ease: EXPO }}
            >
              <p className="max-w-[40ch] text-[14px] leading-snug text-bone/80 sm:text-[15px]">{current.tagline}</p>
              <button
                type="button"
                data-cursor="link"
                onClick={() => open(current.slug)}
                onPointerEnter={() => sfx.hover()}
                className="group mt-4 inline-flex items-center gap-2.5 rounded-full bg-signal px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink shadow-[0_0_28px_-6px_var(--color-signal)] transition-[background-color,box-shadow] duration-300 hover:bg-bone hover:shadow-none"
              >
                View case study
                <span className="sr-only">: {current.title}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  size={14}
                  strokeWidth={1.75}
                  className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right-bottom readout of the screen the camera is passing (md+) */}
      <p
        aria-hidden="true"
        className="label absolute bottom-[max(72px,calc(env(safe-area-inset-bottom,0px)+64px))] right-[calc(var(--gutter)+44px)] hidden text-right md:block"
      >
        Screen <span className="text-signal tabular-nums">{pad2(active + 1)}</span> / {pad2(WORK_COUNT)}
        <span className="mt-1 block text-bone">{splitTitle(current.title).main}</span>
      </p>
    </div>
  );
}
