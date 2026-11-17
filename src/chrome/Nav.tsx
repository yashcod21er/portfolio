import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { portfolioConfig } from '../data/portfolioConfig';
import { gsap, useGSAP } from '../lib/gsap';
import { lockScroll, prefersReducedMotion, scrollToTarget } from '../lib/smooth';
import { sfx } from '../lib/sound';
import { useSite } from '../lib/store';
import { TextRoll } from '../vendor/skiper/skiper58';
import { MobileMenu, type MenuItem } from './MobileMenu';
import { ScrambleLink } from './Scramble';
import { useActiveSection } from './sectionSpy';
import { SoundToggle } from './SoundToggle';

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Stack', href: '#stack' },
  { label: 'Journey', href: '#journey' },
  { label: 'Contact', href: '#contact' },
];

const MENU_ITEMS: MenuItem[] = [...LINKS, { label: 'Résumé', href: portfolioConfig.resumePath, external: true }];

const detectMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

const ITEM = 'font-mono text-[11px] uppercase tracking-[0.12em]';

/** Nav link whose letters roll on hover / focus (skiper58). A red glowing tick marks the current chapter. */
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
      className={`${ITEM} relative inline-flex items-center gap-2 py-2 transition-colors duration-300 ${current ? 'text-signal' : 'text-bone/80 hover:text-bone'}`}
    >
      <span
        aria-hidden="true"
        className={`size-1 rounded-full bg-signal shadow-[0_0_8px_var(--color-signal)] transition-[opacity,scale] duration-500 ease-expo ${current ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      />
      <span className="sr-only">{label}</span>
      <TextRoll inherit center className="leading-none">
        {label}
      </TextRoll>
    </motion.a>
  );
}

/**
 * Fixed top bar over the world: a soft ink fade behind bone text with red accents.
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
        delay: 0.7,
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
      <header ref={headerRef} onFocusCapture={() => setHidden(false)} className="pointer-events-none fixed inset-x-0 top-0 z-[70] text-bone">
        {/* soft ink fade so the bar reads over bright red light */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[120%] bg-[linear-gradient(to_bottom,rgb(7_5_6/0.78),rgb(7_5_6/0.35)_60%,transparent)]"
        />
        <div className="gutter relative flex items-center justify-between gap-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] md:pt-[max(22px,env(safe-area-inset-top))]">
          <a
            data-nav-item
            href="#intro"
            aria-label={`${portfolioConfig.name}, back to the start`}
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              go('#intro');
            }}
            className="group pointer-events-auto flex items-center gap-3"
          >
            <span className="display-x grid size-9 place-items-center border border-signal/60 text-[15px] tracking-[-0.04em] text-bone transition-[background-color,box-shadow] duration-300 group-hover:bg-signal group-hover:text-ink group-hover:shadow-[0_0_22px_-4px_var(--color-signal)]">
              YH
            </span>
            <span className="hidden flex-col leading-tight lg:flex">
              <span className={`${ITEM} text-bone`}>{portfolioConfig.name}</span>
              <span className={`${ITEM} text-mute`}>{portfolioConfig.role}</span>
            </span>
          </a>

          <nav aria-label="Primary" className="pointer-events-auto hidden items-center gap-7 md:flex">
            <ul className="flex items-center gap-6">
              {LINKS.map((link) => (
                <li key={link.href} data-nav-item>
                  <RollLink label={link.label} href={link.href} current={active === link.href.slice(1)} onGo={go} />
                </li>
              ))}
            </ul>
            <span aria-hidden="true" className="h-4 w-px bg-line" />
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
              className={`${ITEM} border border-signal/50 px-2.5 py-1 text-bone transition-[background-color,color,box-shadow] duration-300 hover:bg-signal hover:text-ink hover:shadow-[0_0_20px_-4px_var(--color-signal)]`}
            >
              {isMac ? '⌘K' : 'Ctrl K'}
            </button>
            <span data-nav-item>
              <ScrambleLink
                href={portfolioConfig.resumePath}
                target="_blank"
                rel="noopener noreferrer"
                text="Résumé"
                aria-label="Résumé (opens in a new tab)"
                className={`${ITEM} py-2 text-bone/80 transition-colors hover:text-signal`}
                onPointerEnter={() => sfx.hover()}
              >
                <ArrowUpRight aria-hidden="true" size={13} strokeWidth={1.5} />
              </ScrambleLink>
            </span>
            <span data-nav-item className="flex text-bone/80">
              <SoundToggle showLabel />
            </span>
          </nav>

          <div className="pointer-events-auto flex items-center gap-3 md:hidden">
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
              className={`${ITEM} -mx-2 -my-3 flex items-center gap-2 px-2 py-3`}
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full bg-signal transition-opacity ${open ? 'opacity-100' : 'opacity-60'}`} />
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{open && <MobileMenu items={MENU_ITEMS} onNavigate={go} />}</AnimatePresence>
    </>
  );
}
