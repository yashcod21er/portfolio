import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { portfolioConfig as cfg } from '../../data/portfolioConfig';
import { sfx } from '../../lib/sound';
import { LineHoverLink } from '../../vendor/vengeance/line-hover-link';
import { selectContents } from './clipboard';

type Status = 'idle' | 'copied' | 'selected';

/** The address as big selectable type, a Copy control with a rolling confirmation, and mailto. */
export default function EmailBlock() {
  const email = cfg.socials.email;
  const textRef = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);
  const [status, setStatus] = useState<Status>('idle');
  const reduce = useReducedMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (s: Status) => {
    setStatus(s);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 2400);
  };

  const onCopy = () => {
    sfx.click();
    const fallback = () => {
      selectContents(textRef.current);
      settle('selected');
    };
    if (!navigator.clipboard?.writeText) return fallback();
    // Called synchronously inside the click handler so the gesture is honoured.
    navigator.clipboard.writeText(email).then(() => settle('copied'), fallback);
  };

  const [user, domain] = email.split('@');
  const roll = reduce ? { duration: 0.01 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="@container">
      <p className="label mb-4 flex items-center gap-3" data-reveal>
        <span>Write to me</span>
        <span className="h-px w-8 bg-line" aria-hidden />
        <span className="text-bone/70">replies within a day or two</span>
      </p>

      <span
        ref={textRef}
        data-reveal
        className="display block text-[clamp(1.5rem,9cqw,6.5rem)] leading-[0.95] [overflow-wrap:anywhere] text-bone select-text selection:bg-ochre selection:text-ink"
        style={{ fontVariationSettings: '"opsz" 96, "wdth" 75, "wght" 560' }}
      >
        {user}
        <wbr />
        <span className="text-ochre">@</span>
        {domain}
      </span>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3" data-reveal>
        <button
          type="button"
          onClick={onCopy}
          onPointerEnter={() => sfx.hover()}
          data-cursor="link"
          aria-label={`Copy ${email} to clipboard`}
          className="group label inline-flex h-10 items-center gap-2.5 border-b border-line text-bone transition-colors hover:border-ochre"
        >
          <span className="relative grid size-4 place-items-center overflow-hidden" aria-hidden>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={status === 'copied' ? 'check' : 'copy'}
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                exit={{ y: '-110%' }}
                transition={roll}
                className="grid place-items-center"
              >
                {status === 'copied' ? (
                  <Check size={14} strokeWidth={2} className="text-ochre" />
                ) : (
                  <Copy size={13} strokeWidth={1.7} />
                )}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="relative inline-grid h-[1.4em] overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={status}
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                exit={{ y: '-110%' }}
                transition={roll}
                className="block leading-[1.4em]"
              >
                {status === 'copied' ? 'Copied' : status === 'selected' ? 'Selected — press ⌘C / Ctrl C' : 'Copy address'}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>

        <span className="inline-flex h-10 items-center">
          <LineHoverLink
            variant="double"
            href={`mailto:${email}`}
            data-cursor="link"
            onPointerEnter={() => sfx.hover()}
            onClick={() => sfx.click()}
            className="label gap-1.5 text-bone transition-colors duration-300 hover:text-ochre focus-visible:text-ochre"
          >
            Open in mail
            <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden />
          </LineHoverLink>
        </span>

        <span className="sr-only" role="status" aria-live="polite">
          {status === 'copied' ? 'Email address copied' : status === 'selected' ? 'Email address selected' : ''}
        </span>
      </div>
    </div>
  );
}
