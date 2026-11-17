import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { portfolioConfig } from '../data/portfolioConfig';
import { PuneClock } from './PuneClock';

const EXPO = [0.16, 1, 0.3, 1] as const;
const QUART = [0.76, 0, 0.24, 1] as const;
const EXPO_IN = [0.7, 0, 0.84, 0] as const;

export interface MenuItem {
  label: string;
  href: string;
  external?: boolean;
}

interface Props {
  items: MenuItem[];
  onNavigate: (href: string) => void;
}

/** Full-screen mobile menu: ink sheet wipes down, display links rise in from masks. */
export function MobileMenu({ items, onNavigate }: Props) {
  const reduce = useReducedMotion();
  const firstRef = useRef<HTMLAnchorElement>(null);
  const t = (s: number) => (reduce ? 0 : s);

  useEffect(() => {
    const id = requestAnimationFrame(() => firstRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[65] flex flex-col bg-ink md:hidden"
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: t(0.75), ease: QUART } }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: t(0.6), ease: QUART, delay: t(0.12) } }}
    >
      <nav
        aria-label="Mobile"
        className="gutter flex flex-1 flex-col justify-center pt-[calc(env(safe-area-inset-top,0px)+64px)]"
      >
        <ul className="border-t border-line">
          {items.map((item, i) => (
            <li key={item.href} className="overflow-hidden border-b border-line">
              <motion.a
                ref={i === 0 ? firstRef : undefined}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  if (item.external) return;
                  e.preventDefault();
                  onNavigate(item.href);
                }}
                className="display flex items-baseline justify-between py-2 text-[clamp(56px,18vw,104px)] text-bone"
                initial={{ y: '105%' }}
                animate={{ y: '0%', transition: { delay: t(0.2 + i * 0.07), duration: t(0.95), ease: EXPO } }}
                exit={{ y: '105%', transition: { delay: t(i * 0.03), duration: t(0.35), ease: EXPO_IN } }}
              >
                <span>
                  {item.label}
                  {item.external && <span className="serif-i text-mute"> ↗</span>}
                </span>
                <span className="label tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              </motion.a>
            </li>
          ))}
        </ul>
      </nav>

      <motion.div
        className="gutter label flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: t(0.5), duration: t(0.6) } }}
        exit={{ opacity: 0, transition: { duration: t(0.2) } }}
      >
        <div className="flex flex-col gap-2">
          <a href={`mailto:${portfolioConfig.socials.email}`} className="text-bone normal-case tracking-normal">
            {portfolioConfig.socials.email}
          </a>
          <div className="flex gap-5">
            <a href={portfolioConfig.socials.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={portfolioConfig.socials.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
        <PuneClock />
      </motion.div>
    </motion.div>
  );
}
