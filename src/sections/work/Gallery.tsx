import { useEffect, useRef, type FocusEvent, type MouseEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP, type ScrollTrigger } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/smooth';
import { cn } from '../../lib/cn';
import { portfolioConfig } from '../../data/portfolioConfig';
import type { Project } from '../../types/portfolio';
import {
  HORIZONTAL_QUERY,
  REDUCED_QUERY,
  pad,
  prettyUrl,
  projects,
  refreshScroll,
  splitTitle,
  useMediaQuery,
  useOpenProject,
} from './projectUtils';

const total = projects.length;

export default function Gallery() {
  const horizontal = useMediaQuery(HORIZONTAL_QUERY);
  const reduced = useMediaQuery(REDUCED_QUERY);
  const open = useOpenProject();

  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  useGSAP(
    () => {
      stRef.current = null;
      if (reduced) return;
      const root = rootRef.current;
      if (!root) return;
      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', root);

      if (horizontal && pinRef.current && trackRef.current) {
        const pin = pinRef.current;
        const track = trackRef.current;
        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);

        // Velocity skew: quickTo chases the target, a delayed call settles it back to 0.
        const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.7, ease: 'power3.out' });
        const settle = gsap.delayedCall(0.12, () => skewTo(0)).pause();
        const clampSkew = gsap.utils.clamp(-6, 6);

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 1,
            onUpdate: (self) => {
              skewTo(clampSkew(self.getVelocity() / -300));
              settle.restart(true);
              if (progressRef.current) gsap.set(progressRef.current, { scaleX: self.progress });
              if (counterRef.current) {
                counterRef.current.textContent = pad(Math.min(total, Math.floor(self.progress * total) + 1));
              }
            },
          },
        });
        stRef.current = tween.scrollTrigger ?? null;

        panels.forEach((panel, i) => {
          const frame = panel.querySelector('[data-frame]');
          const img = panel.querySelector('[data-parallax]');
          const rise = panel.querySelectorAll('[data-rise]');

          // Inner image drifts against the track direction.
          if (img) {
            gsap.fromTo(
              img,
              { xPercent: -6 },
              {
                xPercent: 6,
                ease: 'none',
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              },
            );
          }

          if (i === 0) {
            // First panel is already on stage when the pin begins: reveal as the section arrives.
            const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
            if (frame) {
              tl.fromTo(
                frame,
                { clipPath: 'inset(0% 0% 0% 100%)' },
                { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' },
              );
            }
            if (rise.length) tl.from(rise, { yPercent: 40, opacity: 0, stagger: 0.08 }, '-=0.7');
            return;
          }

          if (frame) {
            gsap.fromTo(
              frame,
              { clipPath: 'inset(0% 0% 0% 100%)' },
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                ease: 'none',
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: tween,
                  start: 'left 98%',
                  end: 'left 40%',
                  scrub: true,
                },
              },
            );
          }
          if (rise.length) {
            gsap.from(rise, {
              yPercent: 40,
              opacity: 0,
              stagger: 0.08,
              scrollTrigger: {
                trigger: panel,
                containerAnimation: tween,
                start: 'left 72%',
                toggleActions: 'play none none reverse',
              },
            });
          }
        });

        const outro = root.querySelectorAll('[data-outro]');
        if (outro.length) {
          gsap.from(outro, {
            yPercent: 30,
            opacity: 0,
            stagger: 0.1,
            scrollTrigger: {
              trigger: root.querySelector('[data-end-panel]'),
              containerAnimation: tween,
              start: 'left 80%',
              toggleActions: 'play none none reverse',
            },
          });
        }
        return;
      }

      // Vertical stack (tablet / mobile): per-panel scroll reveals, no pin.
      panels.forEach((panel) => {
        const frame = panel.querySelector('[data-frame]');
        const img = panel.querySelector('[data-parallax]');
        const rise = panel.querySelectorAll('[data-rise]');
        const tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: 'top 85%', once: true } });
        if (frame) {
          tl.fromTo(
            frame,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' },
          );
        }
        if (img) tl.from(img, { scale: 1.25, duration: 1.6 }, 0);
        if (rise.length) tl.from(rise, { y: 28, opacity: 0, stagger: 0.08 }, 0.5);
      });
      const outro = root.querySelectorAll('[data-outro]');
      if (outro.length) {
        gsap.from(outro, {
          y: 28,
          opacity: 0,
          stagger: 0.1,
          scrollTrigger: { trigger: root.querySelector('[data-end-panel]'), start: 'top 85%', once: true },
        });
      }
    },
    { scope: rootRef, dependencies: [horizontal, reduced], revertOnUpdate: true },
  );

  // Layout mode changed (or first mount): re-sort so the pin is measured before anything below it.
  useEffect(() => {
    const id = requestAnimationFrame(refreshScroll);
    return () => cancelAnimationFrame(id);
  }, [horizontal, reduced]);

  /**
   * Keyboard users tabbing through the pinned track: scroll the page to the point where the
   * focused panel sits centred on stage (the clip wrapper itself can't scroll).
   */
  const onPanelFocus = (e: FocusEvent<HTMLElement>) => {
    const st = stRef.current;
    const pin = pinRef.current;
    if (!horizontal || !st || !pin || !e.currentTarget.matches(':focus-visible')) return;
    const panel = e.currentTarget;
    const x = panel.offsetLeft - (pin.clientWidth - panel.offsetWidth) / 2;
    const span = st.end - st.start;
    scrollToTarget(st.start + gsap.utils.clamp(0, span, x));
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={pinRef}
        className={cn(
          'relative',
          horizontal && 'flex h-svh flex-col justify-center overflow-clip pt-[7svh]',
        )}
      >
        <div
          ref={trackRef}
          className={cn(
            'gutter relative',
            horizontal
              ? 'flex w-max items-stretch gap-[5vw] will-change-transform'
              : 'mx-auto flex max-w-[1600px] flex-col gap-[clamp(4.5rem,14vw,8rem)]',
          )}
        >
          {projects.map((p, i) => (
            <Panel
              key={p.slug}
              project={p}
              index={i}
              horizontal={horizontal}
              onOpen={open}
              onFocus={onPanelFocus}
            />
          ))}
          <EndPanel horizontal={horizontal} onFocus={onPanelFocus} />
        </div>

        {horizontal && (
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-0 pb-[3.5svh]" aria-hidden="true">
            <div className="flex items-center gap-5">
              <span className="label tabular-nums">
                <span ref={counterRef} className="text-bone">
                  01
                </span>{' '}
                / {pad(total)}
              </span>
              <span className="relative h-px flex-1 bg-line">
                <span
                  ref={progressRef}
                  className="absolute inset-0 origin-left scale-x-0 bg-ochre"
                />
              </span>
              <span className="label">Scroll</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({
  project: p,
  index,
  horizontal,
  onOpen,
  onFocus,
}: {
  project: Project;
  index: number;
  horizontal: boolean;
  onOpen: (e: MouseEvent<HTMLAnchorElement>, slug: string) => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
}) {
  const { main, aside } = splitTitle(p.title);
  return (
    <a
      href={`?project=${p.slug}`}
      data-panel
      data-project-link={p.slug}
      data-cursor="view"
      data-cursor-label="Open case"
      aria-label={`${p.title}: open case study`}
      onClick={(e) => onOpen(e, p.slug)}
      onFocus={onFocus}
      className={cn(
        'work-panel group relative block shrink-0',
        horizontal ? 'w-[min(104svh,68vw)]' : 'w-full',
      )}
    >
      <div data-rise className="mb-4 flex items-baseline justify-between gap-4">
        <span className="label tabular-nums">
          <span className="text-bone">{pad(index + 1)}</span> / {pad(total)}
        </span>
        <span className="label flex items-center gap-3">
          <span>{p.category}</span>
          <span aria-hidden="true" className="h-px w-5 bg-line" />
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ochre" />
            {p.status}
          </span>
        </span>
      </div>

      <div data-frame className="relative aspect-[1024/532] overflow-hidden bg-ink-2">
        <div className="work-panel__zoom absolute inset-0">
          <img
            data-parallax
            src={p.image}
            alt={`${p.title} interface preview`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-y-0 left-[-8%] h-full w-[116%] max-w-none object-cover object-top"
          />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-bone/10" />
      </div>

      <div
        className={cn(
          'mt-6 grid gap-x-10 gap-y-5',
          horizontal ? 'grid-cols-12 items-end' : 'md:grid-cols-12 md:items-end',
        )}
      >
        <h3
          data-rise
          className={cn(
            'work-panel__title display',
            horizontal
              ? 'col-span-7 text-[clamp(3rem,5.6vw,7rem)]'
              : 'text-[clamp(2.9rem,12vw,6.5rem)] md:col-span-7',
          )}
        >
          {main}
          {aside && (
            <span className="serif-i mt-[0.2em] block text-[0.42em] leading-none tracking-normal text-mute">
              {aside}
            </span>
          )}
        </h3>
        <div data-rise className={cn(horizontal ? 'col-span-5' : 'md:col-span-5')}>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-bone/80 md:text-base">{p.tagline}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {p.technologies.map((t) => (
              <li
                key={t}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute"
              >
                {t}
              </li>
            ))}
          </ul>
          <span className="work-panel__cta label mt-5 inline-flex items-center gap-2">
            Open case study
            <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </a>
  );
}

function EndPanel({ horizontal, onFocus }: { horizontal: boolean; onFocus: (e: FocusEvent<HTMLElement>) => void }) {
  const gh = portfolioConfig.socials.github;
  return (
    <a
      href={gh}
      target="_blank"
      rel="noreferrer"
      data-end-panel
      data-cursor="link"
      onFocus={onFocus}
      className={cn(
        'work-panel group flex shrink-0 flex-col justify-between gap-10',
        horizontal
          ? 'w-[min(60svh,34vw)] border-l border-line py-2 pl-[3vw]'
          : 'w-full border-t border-line pt-6',
      )}
    >
      <span data-outro className="label">
        Archive
      </span>
      <span data-outro className="work-panel__title display block text-[clamp(3rem,6.4vw,7.5rem)]">
        All code
        <br />
        on <span className="serif-i pr-[0.06em]">GitHub</span>
        <span className="work-panel__cta ml-[0.15em] inline-block" aria-hidden="true">
          →
        </span>
      </span>
      <span data-outro className="label flex items-center justify-between gap-4">
        <span>{prettyUrl(gh)}</span>
        <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.5} />
      </span>
    </a>
  );
}
