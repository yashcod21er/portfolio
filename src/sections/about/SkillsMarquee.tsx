import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';
import { cn } from '../../lib/cn';

interface Props {
  names: string[];
}

/** Base drift in viewport-widths per second. */
const BASE = 0.035;

function Row({ items, offset, dir }: { items: string[]; offset: number; dir: 1 | -1 }) {
  // Two identical copies so the track can wrap seamlessly at -50%.
  const copy = (key: string) => (
    <span key={key} className="flex shrink-0 items-center">
      {items.map((name, i) => (
        <span key={name} className="flex items-center">
          <span className={cn('display px-[0.18em]', (i + offset) % 2 ? 'ab-outline' : 'text-bone')}>
            {name}
          </span>
          <span aria-hidden className="mx-[0.12em] block size-[0.09em] rounded-full bg-ochre" />
        </span>
      ))}
    </span>
  );
  return (
    <div data-track data-dir={dir} className="ab-marquee-row flex w-max">
      {copy('a')}
      {copy('b')}
    </div>
  );
}

/**
 * Full-bleed two-row marquee. Rows drift in opposite directions; scrolling speeds them up
 * (ScrollTrigger velocity) and flips them with scroll direction. Hovering parks them.
 * Decorative: the accordion below carries the same names for assistive tech.
 */
export default function SkillsMarquee({ names }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mid = Math.ceil(names.length / 2);
  const rowA = names.slice(0, mid);
  const rowB = names.slice(mid);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;

      const tracks = gsap.utils.toArray<HTMLElement>('[data-track]', root.current);
      const state = tracks.map((el) => ({
        el,
        dir: Number(el.dataset.dir) || 1,
        x: 0,
        half: el.scrollWidth / 2,
        setX: gsap.quickSetter(el, 'x', 'px') as (v: number) => void,
      }));

      const measure = () => state.forEach((s) => (s.half = s.el.scrollWidth / 2 || 1));
      measure();
      document.fonts?.ready.then(measure).catch(() => {});

      let scrollDir = 1;
      let boost = 0;
      let boostNow = 0;
      let hover = 1;
      let hoverNow = 1;

      const tick = (_t: number, dt: number) => {
        const step = Math.min(dt, 64) / 1000;
        boostNow += (boost - boostNow) * 0.12;
        boost *= 0.92;
        hoverNow += (hover - hoverNow) * 0.07;
        const speed = BASE * window.innerWidth * (1 + boostNow) * hoverNow * scrollDir * step;
        for (const s of state) {
          s.x = gsap.utils.wrap(-s.half, 0, s.x - speed * s.dir);
          s.setX(s.x);
        }
      };

      let running = false;
      const run = (on: boolean) => {
        if (on === running) return;
        running = on;
        if (on) gsap.ticker.add(tick);
        else gsap.ticker.remove(tick);
      };

      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => run(self.isActive),
        onUpdate: (self) => {
          scrollDir = self.direction;
          boost = Math.min(Math.abs(self.getVelocity()) / 220, 9);
        },
        onRefresh: measure,
      });

      const el = root.current;
      const fine = isFinePointer();
      const park = () => fine && (hover = 0);
      const release = () => (hover = 1);
      el.addEventListener('pointerenter', park);
      el.addEventListener('pointerleave', release);

      return () => {
        run(false);
        el.removeEventListener('pointerenter', park);
        el.removeEventListener('pointerleave', release);
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="relative overflow-hidden border-y border-line py-[clamp(16px,2vw,32px)] select-none"
    >
      <Row items={rowA} offset={0} dir={1} />
      <Row items={rowB} offset={1} dir={-1} />
    </div>
  );
}
