import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { journeyStations } from '../data/journeyData';
import { useChapterVar, useSegment } from './useChapter';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * Chapter 04 — Journey. One station card at a time, synced to where the camera is on the
 * trail, over a nine-tick progress rail. The full list is in the DOM for screen readers.
 */
export default function JourneyChapter() {
  const index = useSegment('journey', journeyStations.length);
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  useChapterVar('journey', stageRef);
  const s = journeyStations[index];
  const total = journeyStations.length;

  return (
    <div ref={stageRef} className="ov-stage flex flex-col justify-end">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(7_5_6/0.85)_0%,rgb(7_5_6/0.4)_40%,transparent_65%)]"
      />

      <h2 className="label relative flex items-center gap-2.5">
        <span className="text-signal">04</span>
        <span aria-hidden="true" className="h-px w-6 bg-signal/60" />
        Journey — {total} stations
      </h2>

      {/* Screen-reader version of every station */}
      <ol className="sr-only">
        {journeyStations.map((st) => (
          <li key={st.id}>
            {st.numberStr}. {st.title} — {st.subtitle}. {st.description} Skills: {st.skills.join(', ')}.
          </li>
        ))}
      </ol>

      {/* Visual card: the station the camera is passing */}
      <div aria-hidden="true" className="relative mt-5 min-h-[clamp(15rem,40vh,21rem)] w-full max-w-[640px] md:max-w-[min(640px,42vw)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={s.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: reduce ? 0.15 : 0.5, ease: EXPO }}
            className="brackets border border-line/70 bg-ink/80 p-[clamp(1rem,2.4vw,1.75rem)] shadow-[0_24px_80px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop-saturate-50"
          >
            <i />
            <i />
            <i />
            <i />
            <div className="flex items-end gap-[clamp(0.75rem,2vw,1.25rem)]">
              <span className="display-x glow shrink-0 text-[clamp(3.25rem,6vw,6.5rem)] text-signal tabular-nums">
                {s.numberStr}
              </span>
              <div className="min-w-0 pb-[0.2em]">
                <p className="label flex flex-wrap items-center gap-x-2">
                  {s.district}
                  <span className="text-signal">·</span>
                  <span className={s.status === 'COMPLETED' ? 'text-bone/70' : 'text-signal'}>{s.status}</span>
                </p>
                <h3 className="display-x mt-2 break-words text-[clamp(1.6rem,3vw,3.25rem)]">{s.title}</h3>
              </div>
            </div>
            <p className="mt-4 text-[clamp(1rem,1.5vw,1.2rem)] font-medium leading-snug text-bone">{s.subtitle}</p>
            <p className="mt-2 line-clamp-4 max-w-[58ch] text-[13.5px] leading-relaxed text-bone/70 sm:line-clamp-none sm:text-[14.5px]">
              {s.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {s.skills.map((k) => (
                <li
                  key={k}
                  className="rounded-full border border-signal/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-bone/85"
                >
                  {k}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress rail: fill follows the camera, ticks mark stations */}
      <div aria-hidden="true" className="relative mt-6 w-full max-w-[640px] md:max-w-[min(640px,42vw)]">
        <div className="relative h-px w-full bg-line">
          <span className="ov-rail-fill absolute inset-0 block bg-signal shadow-[0_0_10px_var(--color-signal)]" />
        </div>
        <ol className="mt-2.5 grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {journeyStations.map((st, i) => (
            <li key={st.id} className="flex flex-col items-start gap-1.5">
              <span
                className={`block w-px transition-[height,background-color] duration-500 ${i === index ? 'h-3 bg-signal' : i < index ? 'h-2 bg-bone/60' : 'h-2 bg-line'}`}
              />
              <span className={`font-mono text-[10px] tabular-nums ${i === index ? 'text-signal' : 'text-mute'}`}>
                {st.numberStr}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
