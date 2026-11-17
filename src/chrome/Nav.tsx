import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { portfolioConfig } from '../data/portfolioConfig';
import { gsap, useGSAP } from '../lib/gsap';
import { lockScroll, prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { sfx } from '../lib/sound';
import { useSite } from '../lib/store';
import { TextRoll } from '../vendor/skiper/skiper58';
import EdgeBlur from './EdgeBlur';
import { MobileMenu, type MenuItem } from './MobileMenu';
import { PuneClock } from './PuneClock';
import { ScrambleLink } from './Scramble';
import ScrollHud from './ScrollHud';
import { useActiveSection } from './sectionSpy';
import { SoundToggle } from './SoundToggle';

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const MENU_ITEMS: MenuItem[] = [
  ...LINKS,
  { label: 'Resume', href: portfolioConfig.resumePath, external: true },
];

const detectMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

const ITEM = 'font-mono text-[11px] uppercase tracking-[0.12em]';

/** Nav link whose letters roll on hover / focus (skiper58). Ochre tick marks the current section. */
function RollLink({ label, href, current, onGo }: { label: string; href: string; current: boolean; onGo: (href: string) => void }) {
  return (
    <motion.a
      href={href}
      aria-current={current ? 'true' : undefined}
      initial="initial"
      animate="initial"
      whileHover="hovered"
      whileFocus="hovered"
      onPointerEnter={() => sfx.hover()}
      onClick={(e) => {
        e.preventDefault();
        sfx.click();
        onGo(href);
      }}
      className={`${ITEM} relative inline-flex items-center gap-2 py-2`}
    >
      <span
        aria-hidden="true"
        className={`size-1 rounded-full bg-current transition-[opacity,scale] duration-500 ease-expo ${current ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      />
      <span className="sr-only">{label}</span>
      <TextRoll inherit center className="leading-none">
        {label}
      </TextRoll>
    </motion.a>
  );
}

/**
 * Fixed top bar. Text uses mix-blend-difference so it reads over the portrait, ochre and ink alike.
 * Hides on scroll down, returns on scroll up. Below 768px the links collapse into a full-screen menu.
 */
export default function Nav() {
  const loaded = useSite((s) => s.loaded);
  const setPaletteOpen = useSite((s) => s.setPaletteOpen);
  const headerRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef(false);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [isMac] = useState(detectMac);
  const active = useActiveSection();

  const setHidden = useCallback((hide: boolean) => {
    const header = headerRef.current;
    if (!header || hide === hiddenRef.current) return;
    hiddenRef.current = hide;
    gsap.to(header, {
      yPercent: hide ? -110 : 0,
      duration: hide ? 0.5 : 0.8,
      ease: hide ? 'power3.inOut' : 'expo.out',
      overwrite: 'auto',
    });
  }, []);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 6) return;
      last = y;
      if (openRef.current) return setHidden(false);
      setHidden(delta > 0 && y > 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setHidden]);

  // Mobile menu: lock scroll, Esc closes, closes itself when the viewport grows past mobile.
  useEffect(() => {
    openRef.current = open;
    if (!open) return;
    setHidden(false);
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => {
      if (mq.matches) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    const btn = menuBtnRef.current;
    return () => {
      lockScroll(false);
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      btn?.focus({ preventScroll: true });
    };
  }, [open, setHidden]);

  // Intro once the preloader hands off.
  useGSAP(
    () => {
      if (!loaded || prefersReducedMotion()) return;
      gsap.from('[data-nav-item]', {
        yPercent: -140,
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.06,
        delay: 0.55,
        ease: 'expo.out',
      });
    },
    { dependencies: [loaded], scope: headerRef },
  );

  const go = useCallback((href: string) => {
    if (openRef.current) {
      openRef.current = false;
      lockScroll(false);
      setOpen(false);
    }
    scrollToTarget(href);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        onFocusCapture={() => setHidden(false)}
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] text-bone mix-blend-difference"
      >
        <div className="gutter grid grid-cols-[auto_1fr_auto] items-center gap-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] md:pt-[max(22px,env(safe-area-inset-top))] lg:grid-cols-[1fr_auto_1fr]">
          <a
            data-nav-item
            href="#home"
            aria-label="Yash Hogade, back to top"
            onClick={(e) => {
              e.preventDefault();
              go('#home');
            }}
            className="pointer-events-auto flex items-baseline gap-3 justify-self-start"
          >
            <span className="display text-[26px] leading-none">YH</span>
            <span className={`${ITEM} hidden lg:inline`}>Yash Hogade</span>
          </a>

          <div data-nav-item className="justify-self-center">
            <PuneClock className={ITEM} />
          </div>

          <nav aria-label="Primary" className="pointer-events-auto hidden items-center gap-7 justify-self-end md:flex">
            <ul className="flex items-center gap-6">
              {LINKS.map((link) => (
                <li key={link.href} data-nav-item>
                  <RollLink label={link.label} href={link.href} current={active === link.href.slice(1)} onGo={go} />
                </li>
              ))}
            </ul>
            <button
              data-nav-item
              type="button"
              onClick={() => {
                sfx.click();
                setPaletteOpen(true);
              }}
              onPointerEnter={() => sfx.hover()}
              aria-label="Open command palette"
              aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
              className={`${ITEM} rounded-full border border-bone/50 px-2.5 py-1 transition-colors duration-300 hover:bg-bone hover:text-ink`}
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </button>
            <span data-nav-item>
              <ScrambleLink
                href={portfolioConfig.resumePath}
                target="_blank"
                rel="noopener noreferrer"
                text="Resume"
                aria-label="Resume (opens in a new tab)"
                className={`${ITEM} py-2`}
                onPointerEnter={() => sfx.hover()}
              >
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.5} />
              </ScrambleLink>
            </span>
            <span data-nav-item className="flex">
              <SoundToggle showLabel />
            </span>
          </nav>

          <div className="pointer-events-auto flex items-center gap-3 justify-self-end md:hidden">
            <span data-nav-item className="flex">
              <SoundToggle />
            </span>
            <button
              ref={menuBtnRef}
              data-nav-item
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => {
                sfx.click();
                setOpen((o) => !o);
              }}
              className={`${ITEM} -mx-2 -my-3 px-2 py-3`}
            >
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{open && <MobileMenu items={MENU_ITEMS} onNavigate={go} />}</AnimatePresence>

      {/* Viewport chrome that rides along with the nav (z 60, under it) */}
      <EdgeBlur />
      <ScrollHud />
    </>
  );
}
