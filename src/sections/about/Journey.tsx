import { useId, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import { journeyStations } from '../../data/journeyData';
import type { JourneyStation } from '../../types/portfolio';
import { cn } from '../../lib/cn';
import Mask from './Mask';
import { riseIn } from './motion';

/** Where the travelling head sits in the viewport; nodes light up as they cross this line. */
const HEAD_LINE = '62%';
const pad = (n: number) => String(n).padStart(2, '0');

const statusLabel = (s: JourneyStation['status']) =>
  s === 'COMPLETED' ? 'Completed' : s === 'CURRENT' ? 'In progress' : 'Next';

function Station({ st, reached }: { st: JourneyStation; reached: boolean }) {
  const future = st.status === 'FUTURE';
  return (
    <li
      data-station
      data-future={future}
      className={cn(
        'ab-st grid grid-cols-[32px_minmax(0,1fr)] gap-x-4 pb-[clamp(72px,10vw,140px)]',
        'md:grid-cols-[minmax(0,1fr)_72px_minmax(0,2fr)] md:gap-x-0',
        reached && 'is-reached',
      )}
    >
      {/* Desktop: big station number to the left of the rail */}
      <div aria-hidden className="hidden pr-10 text-right md:block">
        <span data-reveal className="ab-st-num inline-block">
          {st.numberStr}
        </span>
      </div>

      {/* Rail column: the node */}
      <div className="relative">
        <span data-node aria-hidden className="ab-node" />
      </div>

      <div className="min-w-0 md:pl-6">
        <p data-reveal className={cn('label flex flex-wrap items-center gap-x-3', future && 'text-ochre')}>
          <span className="text-bone md:hidden">{st.numberStr}</span>
          <span aria-hidden className="block h-px w-5 bg-line md:hidden" />
          <span>{statusLabel(st.status)}</span>
          {future && (
            <>
              <span aria-hidden className="block h-px w-5 bg-ochre-deep" />
              <span>
                still building <span aria-hidden className="ab-caret" />
              </span>
            </>
          )}
        </p>

        <h4 className={cn('ab-st-title mt-4 md:mt-5', future ? 'text-ochre' : 'text-bone')}>
          <span className="sr-only">{`Station ${st.numberStr}: `}</span>
          <Mask>{st.title}</Mask>
        </h4>

        <p
          data-reveal
          className={cn(
            'serif-i mt-3 text-[clamp(22px,2.3vw,34px)] leading-[1.1]',
            future ? 'text-bone' : 'text-bone/80',
          )}
        >
          {st.subtitle}
        </p>

        <p data-reveal className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-mute md:text-base">
          {st.description}
        </p>

        <ul data-reveal className="mt-6 flex flex-wrap gap-1.5" aria-label="Skills at this station">
          {st.skills.map((s) => (
            <li
              key={s}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] uppercase',
                future ? 'border-dashed border-ochre-deep text-ochre' : 'border-line text-mute',
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/**
 * "The road here" — nine stations on a vertical rail. The rail (an SVG path, revealed through a
 * stroke-dashoffset mask) draws with scroll; an ochre head rides its tip and lights each node.
 * The stretch after the last completed station is dashed ochre: the part still being built.
 */
export default function Journey() {
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const maskId = `ab-rail-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const gradId = `${maskId}-fade`;
  const [reduced] = useState(prefersReducedMotion);
  const [geo, setGeo] = useState({ h: 0, split: 0 });

  // Rail geometry: total height + where the future (dashed) stretch begins.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const future = el.querySelector('[data-future="true"] [data-node]');
      const fb = future?.getBoundingClientRect();
      const split = fb ? fb.top + fb.height / 2 - box.top : box.height;
      setGeo((g) =>
        Math.abs(g.h - box.height) < 0.5 && Math.abs(g.split - split) < 0.5
          ? g
          : { h: box.height, split },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      if (reduced || !root.current || !list.current) return;
      const rail = list.current;

      riseIn(root.current.querySelector('[data-heading]')!, 'top 85%');

      // 1. Draw the rail + move the head, scrubbed 1:1 so the head stays on HEAD_LINE.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: rail,
          start: `top ${HEAD_LINE}`,
          end: `bottom ${HEAD_LINE}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo('[data-rail-draw]', { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 0).fromTo(
        head.current,
        { y: 0 },
        { y: () => rail.offsetHeight },
        0,
      );
      gsap.from(head.current, {
        scale: 0,
        duration: 0.6,
        scrollTrigger: { trigger: rail, start: `top ${HEAD_LINE}`, toggleActions: 'play none none reverse' },
      });

      // 2. Each station lights when the head reaches its node; its content rises just ahead.
      gsap.utils.toArray<HTMLElement>('[data-station]', rail).forEach((st) => {
        const node = st.querySelector('[data-node]');
        ScrollTrigger.create({
          trigger: node ?? st,
          start: `center ${HEAD_LINE}`,
          onEnter: () => st.classList.add('is-reached'),
          onLeaveBack: () => st.classList.remove('is-reached'),
        });

        const tlSt = gsap.timeline({
          scrollTrigger: { trigger: st, start: 'top 78%', toggleActions: 'play none none reverse' },
        });
        tlSt
          .from(st.querySelectorAll('[data-rise]'), { yPercent: 120, duration: 1.15, ease: 'expo.out' }, 0)
          .from(
            st.querySelectorAll('[data-reveal]'),
            { y: 28, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'expo.out' },
            0.08,
          );
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const { h, split } = geo;
  const x = 6;

  return (
    <div ref={root} role="group" aria-labelledby="about-road" className="gutter mx-auto w-full max-w-[1600px]">
      <div className="grid gap-y-6 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,2fr)]">
        <p className="label md:pt-3 md:pr-10 md:text-right">
          Journey · {pad(journeyStations.length)} stations
        </p>
        <h3
          id="about-road"
          data-heading
          className="ab-h display text-[clamp(64px,10vw,168px)] text-bone md:col-start-3 md:pl-6"
        >
          <Mask>
            The road <span className="serif-i text-ochre">here</span>
          </Mask>
        </h3>
      </div>

      <div className="relative mt-[clamp(64px,9vw,140px)]">
        {/* Rail */}
        <svg
          aria-hidden
          className="ab-rail"
          width={12}
          height={h || 1}
          viewBox={`0 0 12 ${h || 1}`}
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={12} height={h || 1}>
              <path
                data-rail-draw
                d={`M${x} 0 V${h}`}
                pathLength={1}
                stroke="white"
                strokeWidth={12}
                strokeDasharray="1 1"
                strokeDashoffset={0}
              />
            </mask>
            <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={0} y1={split} x2={0} y2={h}>
              <stop offset="0" style={{ stopColor: 'var(--color-ochre)' }} />
              <stop offset="0.7" style={{ stopColor: 'var(--color-ochre)', stopOpacity: 0.5 }} />
              <stop offset="1" style={{ stopColor: 'var(--color-ochre)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {/* the route ahead, always faintly visible */}
          <path d={`M${x} 0 V${split}`} stroke="var(--color-line)" strokeWidth={1} />
          <path d={`M${x} ${split} V${h}`} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="3 7" />

          {/* the route travelled — revealed by the mask */}
          <g mask={`url(#${maskId})`}>
            <path d={`M${x} 0 V${split}`} stroke="var(--color-bone)" strokeOpacity={0.7} strokeWidth={1} />
            <path d={`M${x} ${split} V${h}`} stroke={`url(#${gradId})`} strokeWidth={1.5} strokeDasharray="3 7" />
          </g>
        </svg>

        {!reduced && <span ref={head} aria-hidden className="ab-head" />}

        <ol ref={list} className="relative m-0 list-none p-0">
          {journeyStations.map((st) => (
            <Station key={st.id} st={st} reached={reduced} />
          ))}
        </ol>
      </div>
    </div>
  );
}
