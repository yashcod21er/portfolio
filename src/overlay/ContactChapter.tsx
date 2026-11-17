import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { portfolioConfig as cfg } from '../data/portfolioConfig';
import { sfx } from '../lib/sound';
import { PuneClock } from '../chrome/PuneClock';
import { LineHoverLink } from '../vendor/vengeance/line-hover-link';
import { copyText, selectContents } from '../sections/contact/clipboard';
import { PUNE_COORDS, useChapterVar } from './useChapter';

const EXPO = [0.16, 1, 0.3, 1] as const;

const LINES: Array<{ text: string; red?: boolean }> = [
  { text: "Let's build" },
  { text: 'something' },
  { text: 'real.', red: true },
];

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * Chapter 05 — Contact. The end card: a massive red-lit line, the email with a copy button,
 * the three links, and the credits footer.
 */
export default function ContactChapter() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  useChapterVar('contact', stageRef);

  const lineVariants = {
    hidden: { y: reduce ? '0%' : '108%' },
    show: (i: number) => ({ y: '0%', transition: { duration: reduce ? 0 : 1.1, ease: EXPO, delay: i * 0.08 } }),
  };

  return (
    <div ref={stageRef} className="ov-stage flex flex-col pb-[max(14px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_64%,rgb(7_5_6/0.7)_0%,transparent_58%),linear-gradient(to_top,rgb(7_5_6/0.85)_0%,rgb(7_5_6/0.3)_45%,transparent_70%)]"
      />

      <p className="label relative flex items-center gap-2.5">
        <span className="text-signal">05</span>
        <span aria-hidden="true" className="h-px w-6 bg-signal/60" />
        Open channel
      </p>

      {/* the portal burns on the right: the whole card stays in the left half on md+ */}
      <div className="relative mt-auto md:max-w-[min(52vw,60rem)]">
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          className="display-x text-[clamp(2.4rem,10.2vw,4.6rem)] md:text-[clamp(3rem,min(6vw,12vh),8.5rem)]"
        >
          <span className="sr-only">Let's build something real.</span>
          {LINES.map((l, i) => (
            <span key={l.text} aria-hidden="true" className="-my-[0.04em] block overflow-hidden py-[0.04em]">
              <motion.span custom={i} variants={lineVariants} className={`block ${l.red ? 'glow text-signal' : 'text-bone'}`}>
                {l.text}
              </motion.span>
            </span>
          ))}
        </motion.h2>

        {/* frosted, so the portal's bright core can never wash out the address or the links */}
        <div className="mt-[clamp(1.25rem,3.5vh,2.5rem)] flex w-fit max-w-full flex-wrap items-end gap-x-10 gap-y-5 rounded-2xl border border-line/60 bg-ink/60 px-[clamp(0.9rem,1.6vw,1.25rem)] pt-3 pb-1 backdrop-blur-md">
          <EmailRow />
          <ul className="flex flex-wrap gap-2">
            <li>
              <PillLink href={cfg.socials.linkedin} label="LinkedIn" />
            </li>
            <li>
              <PillLink href={cfg.socials.github} label="GitHub" />
            </li>
            <li>
              <PillLink href={cfg.resumePath} label="Résumé" />
            </li>
          </ul>
        </div>
      </div>

      <footer className="relative mt-[clamp(1.5rem,4vh,3rem)] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-4 pb-1">
        <p className="label">
          © {cfg.copyrightYear} {cfg.name} <span className="text-signal">·</span> Designed &amp; built by {cfg.name}
        </p>
        <p className="label flex flex-wrap items-center gap-x-3">
          <span>{PUNE_COORDS}</span>
          <PuneClock className="text-bone" />
        </p>
        {/* Skiper UI's free licence requires this attribution — keep it. */}
        <p className="label w-full leading-[1.9] lg:w-auto">
          UI pieces adapted from{' '}
          <LineHoverLink variant="slide" href="https://skiper-ui.com" {...ext} data-cursor="link" className="text-bone">
            Skiper UI
          </LineHoverLink>{' '}
          (skiper-ui.com) &amp;{' '}
          <LineHoverLink
            variant="slide"
            href="https://github.com/Ashutoshx7/VengeanceUI"
            {...ext}
            data-cursor="link"
            className="text-bone"
          >
            Vengeance UI
          </LineHoverLink>{' '}
          (MIT)
        </p>
      </footer>
    </div>
  );
}

function EmailRow() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const addrRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (state === 'idle') return;
    const id = window.setTimeout(() => setState('idle'), 2200);
    return () => window.clearTimeout(id);
  }, [state]);

  const copy = () => {
    sfx.click();
    void copyText(cfg.socials.email).then((ok) => {
      if (!ok) selectContents(addrRef.current);
      setState(ok ? 'copied' : 'failed');
    });
  };

  return (
    <div className="min-w-0">
      <p className="label">Email</p>
      <div className="mt-2 flex min-w-0 items-center gap-3">
        <a
          ref={addrRef}
          href={`mailto:${cfg.socials.email}`}
          data-cursor="link"
          onPointerEnter={() => sfx.hover()}
          className="min-w-0 truncate font-display text-[clamp(1.05rem,2.4vw,2rem)] font-bold tracking-[-0.015em] text-bone underline decoration-signal/50 decoration-1 underline-offset-[6px] transition-colors duration-300 hover:text-signal"
        >
          {cfg.socials.email}
        </a>
        <button
          type="button"
          onClick={copy}
          onPointerEnter={() => sfx.hover()}
          aria-label="Copy email address"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-signal/50 text-bone transition-[background-color,color,box-shadow] duration-300 hover:bg-signal hover:text-ink hover:shadow-[0_0_24px_-4px_var(--color-signal)]"
        >
          {state === 'copied' ? (
            <Check aria-hidden="true" size={15} strokeWidth={1.8} />
          ) : (
            <Copy aria-hidden="true" size={15} strokeWidth={1.6} />
          )}
        </button>
      </div>
      <p role="status" className="label mt-2 min-h-[1.2em] text-signal">
        {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Selected — press Ctrl/⌘ C' : ''}
      </p>
    </div>
  );
}

function PillLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      {...ext}
      data-cursor="link"
      onPointerEnter={() => sfx.hover()}
      className="group inline-flex items-center gap-2 rounded-full border border-line bg-ink/50 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-bone backdrop-blur-sm transition-[border-color,box-shadow,color] duration-300 hover:border-signal hover:text-signal hover:shadow-[0_0_22px_-6px_var(--color-signal)]"
    >
      {label}
      <ArrowUpRight
        aria-hidden="true"
        size={13}
        strokeWidth={1.75}
        className="transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
