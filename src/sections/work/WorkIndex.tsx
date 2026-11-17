import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP } from '../../lib/gsap';
import { sfx } from '../../lib/sound';
import { PixelatedImageTrail } from '../../vendor/vengeance/pixelated-image-trail';
import {
  FINE_HOVER_QUERY,
  REDUCED_QUERY,
  pad,
  projects,
  splitTitle,
  useMediaQuery,
  useOpenProject,
} from './projectUtils';

const TRAIL_IMAGES = projects.map((p) => p.image).filter((src): src is string => !!src);
/** Trail frame width: ~22vw, kept between 220 and 400px. */
const trailWidth = () => Math.min(400, Math.max(220, window.innerWidth * 0.22));

export default function WorkIndex() {
  const fine = useMediaQuery(FINE_HOVER_QUERY);
  const reduced = useMediaQuery(REDUCED_QUERY);
  const withPreview = fine && !reduced;
  const open = useOpenProject();

  const listRef = useRef<HTMLUListElement>(null);
  /** screenshot of the row under the pointer; read by the trail at spawn time */
  const hovered = useRef<string | null>(null);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || reduced) return;
      const rows = list.querySelectorAll('[data-row-inner]');
      const lines = list.querySelectorAll('[data-hairline]');
      const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 82%', once: true } });
      tl.from(lines, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.3, ease: 'expo.inOut', stagger: 0.08 }).from(
        rows,
        { yPercent: 60, opacity: 0, stagger: 0.08 },
        0.35,
      );
    },
    { scope: listRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <div className="gutter mx-auto max-w-[1600px]">
      <div className="hidden grid-cols-[3rem_minmax(0,1.5fr)_minmax(0,0.55fr)_minmax(0,1.15fr)_7.5rem] gap-x-8 pb-4 lg:grid">
        <span className="label">No.</span>
        <span className="label">Project</span>
        <span className="label">Category</span>
        <span className="label">Stack</span>
        <span className="label text-right">Status</span>
      </div>

      {/* wrapper so the trail layer can sit over the list without being a <ul> child */}
      <div className="relative">
        <ul ref={listRef} className="relative">
          {projects.map((p, i) => {
            const { main, aside } = splitTitle(p.title);
            return (
              <li key={p.slug} className="relative">
                <span data-hairline aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line" />
                <a
                  href={`?project=${p.slug}`}
                  data-project-link={p.slug}
                  data-cursor="view"
                  data-cursor-label="Open case"
                  aria-label={`${p.title}: open case study`}
                  onClick={(e) => open(e, p.slug)}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'mouse') return;
                    hovered.current = p.image || null;
                    sfx.hover();
                  }}
                  className="work-row group relative block overflow-hidden"
                >
                  <span aria-hidden="true" className="work-row__sweep absolute inset-0 bg-ochre" />
                  <span
                    data-row-inner
                    className="relative grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-3 py-6 md:py-7 lg:grid-cols-[3rem_minmax(0,1.5fr)_minmax(0,0.55fr)_minmax(0,1.15fr)_7.5rem] lg:items-center lg:gap-x-8 lg:py-8"
                  >
                    <span className="label tabular-nums">{pad(i + 1)}</span>

                    <span className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="work-row__title display lg:whitespace-nowrap text-[clamp(2.4rem,5vw,5.75rem)]">
                        {main}
                      </span>
                      {aside && (
                        <span className="work-row__muted serif-i text-[clamp(1.1rem,1.8vw,1.75rem)] leading-none text-mute">
                          {aside}
                        </span>
                      )}
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      strokeWidth={1.25}
                      className="work-row__arrow size-6 self-center lg:hidden"
                    />

                    <span className="label hidden lg:block">{p.category}</span>
                    <span className="work-row__muted hidden text-sm leading-snug text-mute lg:block">
                      {p.technologies.join(' / ')}
                    </span>
                    <span className="hidden items-center justify-end gap-3 lg:flex">
                      <span className="label">{p.status}</span>
                      <ArrowRight aria-hidden="true" strokeWidth={1.25} className="work-row__arrow size-6" />
                    </span>

                    {/* Compact meta line for small screens */}
                    <span className="col-span-2 col-start-2 flex flex-wrap gap-x-3 gap-y-1 lg:hidden">
                      <span className="label">{p.category}</span>
                      <span className="label" aria-hidden="true">
                        ·
                      </span>
                      <span className="label">{p.status}</span>
                      <span className="work-row__muted basis-full text-[13px] leading-snug text-mute">
                        {p.technologies.join(' / ')}
                      </span>
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
          <li aria-hidden="true" className="relative h-px">
            <span data-hairline className="absolute inset-x-0 top-0 h-px bg-line" />
          </li>
        </ul>

        {withPreview && (
          <PixelatedImageTrail
            images={TRAIL_IMAGES}
            getImage={() => hovered.current}
            targetRef={listRef}
            imageWidth={trailWidth}
            className="z-10"
          />
        )}
      </div>
    </div>
  );
}
