import { useState, type RefObject } from 'react';
import { AnimatePresence, motion, type MotionValue } from 'motion/react';
import { useSite } from '../../lib/store';
import { sfx } from '../../lib/sound';
import { CircularGallery } from '@/vendor/vengeance/circular-gallery';
import { CounterRotateReveal } from '@/vendor/skiper/skiper34';
import { orbitItems, pad, projects, splitTitle } from './content';

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const previews = projects.map((p) => ({ src: p.image, alt: `${p.title} — ${p.tagline}` }));

interface OrbitActProps {
  /** Scroll-driven ring rotation in degrees (written by the pinned timeline). */
  rotationRef: RefObject<number>;
  /** 0 → 1 reveal of the centre preview (Skiper 34 counter-rotation). */
  reveal: MotionValue<number>;
  compact: boolean;
}

/**
 * Act 3 — the four projects on a tilted ring around a large centre preview. The ring turns
 * with scroll; whichever card faces the viewer (or is hovered) fills the preview and the title.
 * Any card, or the preview itself, opens that case study.
 */
export default function OrbitAct({ rotationRef, reveal, compact }: OrbitActProps) {
  const setActiveProject = useSite((s) => s.setActiveProject);
  const [front, setFront] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? front;
  const project = projects[shown];
  const { main, aside } = splitTitle(project.title);

  const open = (index: number) => {
    sfx.click();
    setActiveProject(projects[index].slug);
  };

  return (
    <div className="flex h-full flex-col pb-[clamp(52px,9svh,96px)] pt-[clamp(84px,13svh,136px)]">
      <div className="gutter relative z-10 flex flex-col items-center text-center">
        <p className="label tabular-nums">
          <span className="text-ochre">{pad(shown + 1)}</span> / {pad(projects.length)} · {project.category}
        </p>
        <p className="display relative mt-3 overflow-clip pb-[0.06em] text-[clamp(2.4rem,6.4vw,6rem)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={project.slug}
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              exit={{ y: '-105%' }}
              transition={{ duration: 0.7, ease: EASE_EXPO }}
            >
              {main}
              {aside && !compact ? (
                <span className="serif-i ml-[0.25em] text-[0.62em] text-mute">({aside})</span>
              ) : null}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      <CircularGallery
        className="min-h-0 flex-1"
        items={orbitItems}
        repeat={2}
        tilt={compact ? -10 : -13}
        autoRotateSpeed={2.2}
        parallax={!compact}
        rotationOffset={rotationRef}
        cardLabel="Open case study"
        onFrontChange={setFront}
        onHoverChange={setHover}
        onSelect={(_, index) => open(index)}
        center={
          <button
            type="button"
            onClick={() => open(shown)}
            aria-label={`Open case study: ${project.title}`}
            data-cursor="view"
            data-cursor-label="Open"
            className="block h-full w-full"
          >
            <CounterRotateReveal progress={reveal} images={previews} active={shown} className="h-full w-full">
              <span className="label absolute left-3 top-3 bg-ink/80 px-2 py-1 text-bone">Case study</span>
            </CounterRotateReveal>
          </button>
        }
      />
    </div>
  );
}
