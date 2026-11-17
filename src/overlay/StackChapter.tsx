import { useRef } from 'react';
import { skillsData } from '../data/skillsData';
import { pad2, useChapterVar, useSegment } from './useChapter';

const uniqueSkills = new Set(skillsData.flatMap((d) => d.skills.map((s) => s.name))).size;

/**
 * Chapter 03 — Stack. The statement low-left, the five domains as a right-hand index (this is
 * also the accessible text for the 3D constellation). The domain the camera is nearest glows.
 */
export default function StackChapter() {
  const active = useSegment('stack', skillsData.length);
  const stageRef = useRef<HTMLDivElement>(null);
  useChapterVar('stack', stageRef);

  return (
    <div ref={stageRef} className="ov-stage flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(7_5_6/0.8)_0%,transparent_45%),linear-gradient(to_left,rgb(7_5_6/0.7)_0%,transparent_40%)]"
      />

      <div className="relative">
        <p className="label flex items-center gap-2.5">
          <span className="text-signal">03</span>
          <span aria-hidden="true" className="h-px w-6 bg-signal/60" />
          {skillsData.length} domains · {uniqueSkills} tools
        </p>
        <h2 className="display-x mt-4 text-[clamp(3rem,10vw,9.5rem)]">
          The
          <br />
          <span className="glow text-signal">Stack</span>
        </h2>
      </div>

      <ol className="relative w-full max-w-[440px] border-t border-line lg:mb-1">
        {skillsData.map((d, i) => {
          const on = i === active;
          return (
            <li
              key={d.id}
              aria-current={on ? 'true' : undefined}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-2 border-b border-line py-[clamp(0.45rem,1.2vh,0.8rem)]"
            >
              <span className={`pt-0.5 font-mono text-[11px] tabular-nums transition-colors duration-300 ${on ? 'text-signal' : 'text-mute'}`}>
                {pad2(i + 1)}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className={`font-display text-[clamp(0.95rem,1.4vw,1.2rem)] font-extrabold uppercase tracking-[-0.01em] transition-colors duration-300 ${on ? 'glow text-bone' : 'text-bone/60'}`}
                  >
                    {d.name}
                  </h3>
                  <span className="label hidden shrink-0 text-[10px] xl:inline">{d.tag}</span>
                </div>
                <p className={`mt-1 text-[12.5px] leading-snug transition-colors duration-300 sm:text-[13px] ${on ? 'text-bone/85' : 'text-mute'}`}>
                  {d.skills.map((s) => s.name).join(' · ')}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
