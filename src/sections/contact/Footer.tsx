import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import { gsap, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion, scrollToTarget } from '../../lib/smooth';
import { sfx } from '../../lib/sound';
import { useSite } from '../../lib/store';
import { portfolioConfig as cfg } from '../../data/portfolioConfig';
import { FlipText } from '../../vendor/vengeance/flip-text';
import { LineHoverLink } from '../../vendor/vengeance/line-hover-link';
import PhotoWordmark from './PhotoWordmark';

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function IstClock() {
  const [now, setNow] = useState(() => timeFmt.format(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(timeFmt.format(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);
  const [h, m, s] = now.split(':');
  return (
    <time className="tabular-nums" aria-label={`Local time in Pune ${h}:${m} IST`}>
      {h}
      <span className="animate-pulse text-ochre">:</span>
      {m}
      <span className="text-mute">:{s}</span> IST
    </time>
  );
}

function Cell({ k, children, className = '' }: { k: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div data-foot className={`flex flex-col gap-2 ${className}`}>
      <span className="label">{k}</span>
      <span className="label text-bone">{children}</span>
    </div>
  );
}

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const setPaletteOpen = useSite((s) => s.setPaletteOpen);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('[data-foot]', {
        y: 18,
        opacity: 0,
        stagger: 0.06,
        duration: 1,
        scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
      });
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} data-hud-hide className="relative mt-[clamp(6rem,14vw,12rem)]">
      <div className="gutter mx-auto max-w-[1600px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 md:grid-cols-12">
          <Cell k="Local time · Pune" className="md:col-span-3">
            <IstClock />
          </Cell>
          <Cell k="Coordinates" className="md:col-span-3">
            18.5204° N · 73.8567° E
          </Cell>
          <Cell k="Colophon" className="col-span-2 md:col-span-4">
            Designed &amp; built by Yash Hogade · React · GSAP · Three.js · WebAudio
          </Cell>
          <div data-foot className="col-span-2 flex items-start md:col-span-2 md:justify-end">
            <button
              type="button"
              onClick={() => {
                sfx.whoosh();
                scrollToTarget(0);
              }}
              onPointerEnter={() => sfx.hover()}
              data-cursor="link"
              className="flip-text-scope group label inline-flex items-center gap-2 text-bone transition-colors hover:text-ochre"
            >
              <FlipText trigger="hover" loop={false} duration={1.1}>
                Back to top
              </FlipText>
              <span className="relative grid size-6 place-items-center overflow-hidden rounded-full border border-line transition-colors group-hover:border-ochre">
                <ArrowUp
                  size={12}
                  strokeWidth={1.8}
                  aria-hidden
                  className="transition-transform duration-500 ease-expo group-hover:-translate-y-[2px]"
                />
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 md:mt-14">
          <span className="label">
            © {cfg.copyrightYear} {cfg.name}
          </span>

          {/* Skiper UI's free licence requires this attribution — keep it. */}
          <p className="label max-w-full leading-[1.9]">
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

          <button
            type="button"
            onClick={() => {
              sfx.click();
              setPaletteOpen(true);
            }}
            data-cursor="link"
            className="label inline-flex items-center gap-2 transition-colors hover:text-bone"
          >
            Press
            <kbd className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-bone">⌘K</kbd>/
            <kbd className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-bone">Ctrl K</kbd>
            <span className="hidden sm:inline">for the command palette</span>
          </button>
        </div>
      </div>

      {/* Wordmark: the portrait seen through HOGADE; letters rise as the page ends */}
      <div className="gutter mx-auto max-w-[1600px]">
        <div className="mt-6 md:mt-10">
          <PhotoWordmark scrollRef={ref} />
        </div>
      </div>
    </footer>
  );
}
