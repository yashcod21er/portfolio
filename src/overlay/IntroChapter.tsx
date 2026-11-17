import { useRef, type CSSProperties } from 'react';
import { portfolioConfig as cfg } from '../data/portfolioConfig';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { sfx } from '../lib/sound';
import { useWorld } from '../world/store';
import { useChapterVar, useRevealReady } from './useChapter';

/** The opening statement, line by line. `dx` is how far each line slides as the intro exits. */
const LINES: Array<{ text: string; red?: boolean; dx: string }> = [
  { text: 'I build', dx: '-14vw' },
  { text: 'things that', dx: '-6vw' },
  { text: 'work.', red: true, dx: '-22vw' },
];

/**
 * Chapter 01 — Signal. A film-poster split: the camera's lens shift (CameraRig) frames the 3D
 * portrait in the right ~55% of the screen (upper half on phones), and the statement stays
 * in the left half (lower half on phones), never across his face. Letters rise after the
 * preloader; the whole block slides left and fades as the camera starts to move.
 */
export default function IntroChapter() {
  const ready = useRevealReady();
  const webgl = useWorld((s) => s.webgl);
  const stageRef = useRef<HTMLDivElement>(null);
  useChapterVar('intro', stageRef);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const chars = '[data-intro-char]';
      const fades = '[data-intro-fade]';
      if (!ready) {
        gsap.set(chars, { yPercent: 118 });
        gsap.set(fades, { autoAlpha: 0, y: 18 });
        return;
      }
      gsap
        .timeline({ delay: 0.3 })
        .to(chars, { yPercent: 0, duration: 1.25, stagger: 0.032, ease: 'expo.out' })
        .to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09, ease: 'expo.out' }, 0.55);
    },
    { dependencies: [ready], scope: stageRef },
  );

  return (
    <div ref={stageRef} className="ov-stage flex flex-col">
      {!webgl && <PortraitFallback />}

      {/* Readability shade: darkens the lower-left where the type sits, fades as we fly off */}
      <div
        aria-hidden="true"
        className="ov-intro-shade pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(7_5_6/0.82)_0%,rgb(7_5_6/0.35)_38%,transparent_62%),linear-gradient(to_right,rgb(7_5_6/0.55)_0%,transparent_55%)]"
      />

      <div className="ov-intro-out relative flex flex-1 flex-col">
        {/* Top row: role + tagline, small, out of the portrait's way */}
        <div className="flex flex-col items-start gap-3">
          <p data-intro-fade className="label flex items-center gap-2.5">
            <span className="text-signal">01</span>
            <span aria-hidden="true" className="h-px w-6 bg-signal/60" />
            {cfg.subRole}
          </p>
          <p data-intro-fade className="hidden max-w-[30ch] pl-[calc(1.5rem+1.25rem)] text-[14px] leading-snug text-bone/70 lg:block">
            {cfg.tagline}
          </p>
        </div>

        <div className="mt-auto md:max-w-[52vw]">
          <p className="display-x ov-statement select-none">
            <span className="sr-only">I build things that work.</span>
            {LINES.map((line) => (
              <span
                key={line.text}
                aria-hidden="true"
                className="ov-intro-line -my-[0.04em] block overflow-hidden whitespace-nowrap py-[0.04em]"
                style={{ '--dx': line.dx } as CSSProperties}
              >
                <span className={line.red ? 'glow text-signal' : 'text-bone'}>
                  {Array.from(line.text).map((ch, i) => (
                    <span key={i} data-intro-char className="inline-block will-change-transform">
                      {ch === ' ' ? ' ' : ch}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </p>

          <div className="mt-[clamp(1.25rem,3vw,2.25rem)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="flex flex-col gap-3">
              <h1 data-intro-fade className="font-mono text-[12px] uppercase tracking-[0.14em] text-bone sm:text-[13px]">
                {cfg.name} <span className="text-signal">—</span> {cfg.role} <span className="text-mute">· {cfg.education.city}</span>
              </h1>
              <p
                data-intro-fade
                className="inline-flex w-fit items-center gap-2.5 rounded-full border border-signal/40 bg-ink/60 px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-bone backdrop-blur-sm sm:text-[11px]"
              >
                <span className="signal-dot" aria-hidden="true" />
                Open to internships &amp; full-time roles · 2026–27
              </p>
            </div>

            <button
              data-intro-fade
              type="button"
              onClick={() => {
                sfx.click();
                scrollToTarget('#work');
              }}
              onPointerEnter={() => sfx.hover()}
              className="label group hidden items-center gap-3 text-bone sm:flex"
            >
              <span className="relative block h-10 w-px overflow-hidden bg-line">
                <span className="ov-cue absolute inset-0 block bg-signal" />
              </span>
              Scroll to enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** No WebGL (or reduced motion): the still portrait, red-graded, behind the statement. */
function PortraitFallback() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-ink">
      <div className="ov-fallback absolute inset-0">
        <img
          src="/assets/yash-portrait.webp"
          alt=""
          decoding="async"
          className="h-full w-full object-cover object-[50%_22%]"
        />
        {/* duotone: grey photo × signal red = red highlights over true black */}
        <div className="absolute inset-0 bg-signal mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_20%,rgb(7_5_6/0.75)_80%)]" />
      </div>
      <div className="scanlines absolute inset-0 opacity-70" />
    </div>
  );
}
