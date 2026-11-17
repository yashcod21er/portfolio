import { useRef, type PointerEvent, type ReactNode } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';
import { cn } from '../../lib/cn';
import { sfx } from '../../lib/sound';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  /** opens in a new tab with noopener */
  external?: boolean;
  ariaLabel?: string;
}

/**
 * Pill link that leans toward the pointer (gsap.quickTo) and springs back on leave.
 * Hover fills it bone-from-below with an ink label rolling up in its place.
 */
export default function MagneticPill({ href, children, className, external = true, ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  const handlers = useRef<{ move?: (e: PointerEvent<HTMLAnchorElement>) => void; leave?: () => void }>({});

  useGSAP(
    (_ctx, contextSafe) => {
      const el = ref.current;
      const inner = innerRef.current;
      if (!el || !inner || !contextSafe || !isFinePointer() || prefersReducedMotion()) return;
      const cfg = { duration: 0.6, ease: 'power3.out' };
      const xTo = gsap.quickTo(el, 'x', cfg);
      const yTo = gsap.quickTo(el, 'y', cfg);
      const ixTo = gsap.quickTo(inner, 'x', cfg);
      const iyTo = gsap.quickTo(inner, 'y', cfg);
      let spring: gsap.core.Tween | null = null;

      handlers.current.move = contextSafe((e: PointerEvent<HTMLAnchorElement>) => {
        spring?.kill();
        spring = null;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.32);
        yTo(dy * 0.42);
        ixTo(dx * 0.14);
        iyTo(dy * 0.18);
      });
      // Spring back; quickTo re-attaches itself on the next move (resetTo re-initialises).
      handlers.current.leave = contextSafe(() => {
        spring = gsap.to([el, inner], { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.38)', overwrite: true });
      });
      return () => {
        handlers.current = {};
      };
    },
    { scope: ref },
  );

  return (
    <a
      ref={ref}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      aria-label={ariaLabel}
      data-cursor="link"
      onPointerEnter={() => sfx.hover()}
      onClick={() => sfx.click()}
      onPointerMove={(e) => handlers.current.move?.(e)}
      onPointerLeave={() => handlers.current.leave?.()}
      className={cn(
        'group relative inline-flex h-14 items-center overflow-hidden rounded-full border border-line px-6 text-[15px] text-bone transition-colors duration-500 hover:border-bone focus-visible:border-bone sm:h-16 sm:px-8 sm:text-[17px]',
        className,
      )}
    >
      {/* fill */}
      <span
        aria-hidden
        className="absolute inset-0 origin-bottom scale-y-0 rounded-full bg-bone transition-transform duration-700 ease-expo group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />
      <span ref={innerRef} className="relative inline-flex items-center">
        <span className="relative block overflow-hidden">
          <span className="block transition-transform duration-700 ease-expo group-hover:-translate-y-full group-focus-visible:-translate-y-full">
            {children}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 block translate-y-full text-ink transition-transform duration-700 ease-expo group-hover:translate-y-0 group-focus-visible:translate-y-0"
          >
            {children}
          </span>
        </span>
      </span>
    </a>
  );
}
