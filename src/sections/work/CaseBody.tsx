import type { RefObject } from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Project } from '../../types/portfolio';
import { EASE_EXPO, hasDemo, pad, projects, splitTitle } from './projectUtils';

interface CaseBodyProps {
  project: Project;
  index: number;
  next: Project;
  onNext: () => void;
  /** seconds before the stagger starts (longer on first open, to sit behind the wipe) */
  delay: number;
  reduced: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export default function CaseBody({ project: p, index, next, onNext, delay, reduced, scrollRef }: CaseBodyProps) {
  const { main, aside } = splitTitle(p.title);
  const nextTitle = splitTitle(next.title);
  const nextIndex = projects.indexOf(next);

  const shift = reduced ? 0 : 48;
  const article: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.085, delayChildren: delay } },
    hide: { opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: shift },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0.01 : 1.1, ease: EASE_EXPO } },
  };
  const image: Variants = {
    hidden: { scale: reduced ? 1 : 1.14 },
    show: { scale: 1, transition: { duration: reduced ? 0.01 : 1.8, ease: EASE_EXPO } },
  };
  /** below-the-fold blocks reveal as they scroll into the overlay's own viewport */
  const inView = {
    variants: item,
    initial: 'hidden',
    whileInView: 'show',
    viewport: { root: scrollRef, once: true, amount: 0.2 },
  } as const;

  return (
    <motion.article
      initial="hidden"
      animate="show"
      exit="hide"
      variants={article}
      className="gutter mx-auto max-w-[1600px] pb-[clamp(3rem,6vw,5rem)]"
    >
      {/* ── Title block ─────────────────────────────── */}
      <motion.div
        variants={item}
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-[clamp(2.5rem,7vw,6rem)]"
      >
        <span className="label tabular-nums">
          Case study <span className="text-bone">{pad(index + 1)}</span> / {pad(projects.length)}
        </span>
        <span className="label inline-flex items-center gap-3">
          {p.category}
          <span aria-hidden="true" className="h-px w-5 bg-line" />
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ochre" />
            {p.status}
          </span>
        </span>
      </motion.div>

      <motion.h2
        variants={item}
        id="case-title"
        className="display mt-[clamp(1.25rem,3vw,2.5rem)] text-[clamp(3.4rem,13vw,13rem)]"
      >
        {main}
        {aside && (
          <span className="serif-i mt-[0.12em] block text-[0.36em] leading-none tracking-normal text-mute">
            {aside}
          </span>
        )}
      </motion.h2>

      <motion.div variants={item} className="mt-[clamp(2rem,4vw,3.5rem)] grid gap-8 lg:grid-cols-12 lg:items-end">
        <p className="max-w-[28ch] text-[clamp(1.35rem,2.5vw,2.15rem)] leading-[1.18] tracking-[-0.015em] lg:col-span-7">
          {p.tagline}
        </p>
        <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
          {hasDemo(p.demo) && (
            <a
              href={p.demo}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="group inline-flex items-center gap-2 rounded-full bg-ochre px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:bg-bone"
            >
              Live demo
              <ArrowUpRight
                aria-hidden="true"
                size={14}
                strokeWidth={1.75}
                className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          <a
            href={p.github}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className="group inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink"
          >
            Source
            <ArrowUpRight
              aria-hidden="true"
              size={14}
              strokeWidth={1.75}
              className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </motion.div>

      {/* ── Meta row ─────────────────────────────── */}
      <motion.dl
        variants={item}
        className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-2 border-y border-line md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.4fr)]"
      >
        <div className="border-r border-line py-5 pr-5">
          <dt className="label">Category</dt>
          <dd className="mt-2 text-[15px]">{p.category}</dd>
        </div>
        <div className="py-5 pl-5 md:border-r md:border-line md:pr-5">
          <dt className="label">Status</dt>
          <dd className="mt-2 text-[15px] capitalize">{p.status.toLowerCase()}</dd>
        </div>
        <div className="col-span-2 border-t border-line py-5 md:col-span-1 md:border-t-0 md:pl-5">
          <dt className="label">Stack</dt>
          <dd className="mt-3">
            <ul className="flex flex-wrap gap-1.5">
              {p.technologies.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute"
                >
                  {t}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </motion.dl>

      {/* ── Hero image ─────────────────────────────── */}
      <motion.figure
        variants={item}
        className="relative mt-[clamp(2rem,4vw,3.5rem)] aspect-[1024/532] overflow-hidden bg-ink-2"
      >
        <motion.img
          variants={image}
          src={p.image}
          alt={`${p.title} interface preview`}
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-bone/10" />
      </motion.figure>

      {/* ── Overview ─────────────────────────────── */}
      <motion.section
        {...inView}
        aria-label="Overview"
        className="mt-[clamp(4rem,9vw,8rem)] grid gap-6 border-t border-line pt-6 lg:grid-cols-12"
      >
        <p className="label lg:col-span-3">Overview</p>
        <p className="max-w-[46ch] text-[clamp(1.2rem,2vw,1.7rem)] leading-[1.35] tracking-[-0.01em] lg:col-span-9">
          {p.description}
        </p>
      </motion.section>

      {/* ── Problem / approach ─────────────────────────────── */}
      <div className="mt-[clamp(4rem,9vw,8rem)] grid gap-x-[clamp(2rem,6vw,6rem)] gap-y-14 md:grid-cols-2">
        <motion.section {...inView} aria-labelledby="case-problem" className="border-t border-line pt-6">
          <p className="label">(01)</p>
          <h3 id="case-problem" className="display mt-4 text-[clamp(2.4rem,4.6vw,4.25rem)]">
            The <span className="serif-i">problem</span>
          </h3>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-bone/80">{p.problem}</p>
        </motion.section>
        <motion.section {...inView} aria-labelledby="case-approach" className="border-t border-line pt-6">
          <p className="label">(02)</p>
          <h3 id="case-approach" className="display mt-4 text-[clamp(2.4rem,4.6vw,4.25rem)]">
            The <span className="serif-i">approach</span>
          </h3>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-bone/80">{p.solution}</p>
        </motion.section>
      </div>

      {/* ── Features ─────────────────────────────── */}
      <motion.section
        {...inView}
        aria-labelledby="case-features"
        className="mt-[clamp(4rem,9vw,8rem)] grid gap-8 lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <h3 id="case-features" className="display text-[clamp(2.4rem,4.6vw,4.25rem)]">
            Features
          </h3>
          <p className="label mt-3 tabular-nums">{pad(p.features.length)} items</p>
        </div>
        <ol className="lg:col-span-8">
          {p.features.map((f, i) => (
            <li
              key={f}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 border-t border-line py-4 last:border-b md:py-5"
            >
              <span className="label pt-1 tabular-nums">{pad(i + 1)}</span>
              <span className="text-[16px] leading-snug md:text-[17px]">{f}</span>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* ── Architecture ─────────────────────────────── */}
      {p.architectureHighlights && p.architectureHighlights.length > 0 && (
        <motion.section
          {...inView}
          aria-labelledby="case-architecture"
          className="mt-[clamp(4rem,9vw,8rem)]"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h3 id="case-architecture" className="display text-[clamp(2.4rem,4.6vw,4.25rem)]">
              Architecture <span className="serif-i">highlights</span>
            </h3>
            <p className="label tabular-nums">{pad(p.architectureHighlights.length)} notes</p>
          </div>
          <ol className="mt-8 grid border-t border-line md:grid-cols-3">
            {p.architectureHighlights.map((a, i) => (
              <li
                key={a}
                className="border-b border-line py-6 md:border-b-0 md:border-r md:px-6 md:py-8 md:first:pl-0 md:last:border-r-0"
              >
                <span className="label tabular-nums text-ochre!">{pad(i + 1)}</span>
                <p className="mt-4 max-w-[34ch] text-[16px] leading-snug md:text-[17px]">{a}</p>
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      {/* ── Next project ─────────────────────────────── */}
      <motion.footer {...inView} className="mt-[clamp(5rem,12vw,10rem)] border-t border-line pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label">Next project</span>
          <span className="label tabular-nums">
            {pad(nextIndex + 1)} / {pad(projects.length)}
          </span>
        </div>
        <button
          type="button"
          onClick={onNext}
          data-cursor="view"
          data-cursor-label="Next"
          aria-label={`Next project: ${next.title}`}
          className="case-next group mt-5 flex w-full items-end justify-between gap-6 text-left"
        >
          <span className="case-next__title display block min-w-0 text-[clamp(3rem,11vw,11rem)]">
            {nextTitle.main}
          </span>
          <ArrowRight
            aria-hidden="true"
            strokeWidth={1}
            className="mb-[1vw] size-[clamp(2.25rem,6vw,6rem)] shrink-0 transition-transform duration-700 ease-expo group-hover:translate-x-3"
          />
        </button>
        <p className="mt-4 max-w-[52ch] text-[15px] text-mute">{next.tagline}</p>
      </motion.footer>
    </motion.article>
  );
}
