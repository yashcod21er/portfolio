import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { portfolioConfig } from '../../data/portfolioConfig';
import { cn } from '../../lib/cn';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion, scrollToTarget } from '../../lib/smooth';
import { sfx } from '../../lib/sound';
import { useSite } from '../../lib/store';
import { GLBoundary } from './GLBoundary';
import { canUseWebGL, createFx, INTRO_ZOOM, PORTRAIT_FOCUS, PORTRAIT_SRC } from './fx';
import type { Palette } from './portraitEngine';

const PortraitCanvas = lazy(() => import('./PortraitCanvas'));

/* ---------------------------------------------------------------- content */

const { name, role, tagline, education } = portfolioConfig;
const WORDS = name.toUpperCase().split(' ');
const ROLE_SPLIT = role.lastIndexOf(' ');
const ROLE_HEAD = role.slice(0, ROLE_SPLIT);
const ROLE_TAIL = role.slice(ROLE_SPLIT + 1);
const GRAD_YEAR = education.status.match(/(\d{4})/)?.[1] ?? '2027';
const EDUCATION = `${education.degree.replace(' in ', ' ')} · AISSMS COE, ${education.city} — expected ${GRAD_YEAR}`;
const AVAILABILITY = 'Open to internships & full-time roles · 2026–27';
const COORDS = '18.5204° N · 73.8567° E';

/* ------------------------------------------------------------------ type */

/** Resting / excited variable-font axes for the name. */
const REST = '"opsz" 96, "wdth" 75, "wght" 500';
const axes = (t: number) => `"opsz" 96, "wdth" ${(75 + 25 * t).toFixed(1)}, "wght" ${Math.round(500 + 300 * t)}`;

/** A colour token as 0–1 RGB for the shader (falls back to the DESIGN.md value). */
function readToken(name: string, fallback: string): [number, number, number] {
  const parse = (hex: string) => {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
    return m ? ([parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] as const) : null;
  };
  const css = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name);
  const rgb = parse(css) ?? parse(fallback) ?? [0, 0, 0];
  return [rgb[0], rgb[1], rgb[2]];
}

const readPalette = (): Palette => ({
  ink: readToken('--color-ink', '#0b0d0e'),
  ochre: readToken('--color-ochre', '#e3a23b'),
  bone: readToken('--color-bone', '#ece7df'),
});

/** Touch: hold this long (without dragging) to break the glass. */
const HOLD_MS = 420;

/**
 * Shared pointer / progress state for the DOM timelines and the WebGL portrait.
 * Module-level: there is exactly one hero, and it must never trigger React renders.
 */
const fx = createFx();

function NameWords({ ghost = false }: { ghost?: boolean }) {
  return (
    <>
      {WORDS.map((word, i) => (
        <span
          key={word}
          data-word={i}
          aria-hidden="true"
          className={cn(
            'block overflow-hidden will-change-transform',
            i === 0 ? 'self-start md:self-auto' : 'self-end md:self-auto',
          )}
        >
          {[...word].map((ch, j) => (
            <span key={`${ch}${j}`} data-char={ghost ? 'ghost' : 'main'} className="inline-block">
              {ch}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/* ================================================================== HERO */

export default function Hero() {
  const loaded = useSite((s) => s.loaded);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const frameHeadRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const [palette] = useState(readPalette);
  const [fine] = useState(isFinePointer);
  const [glOn, setGlOn] = useState(() => !prefersReducedMotion() && canUseWebGL());
  const [glReady, setGlReady] = useState(false);
  const [inView, setInView] = useState(true);
  /** lens + shatter only exist while the WebGL portrait is actually on screen */
  const glLive = useRef(false);
  useEffect(() => {
    glLive.current = glOn && glReady;
  }, [glOn, glReady]);

  /** 0 → 1 portrait reveal (clip from the bottom up); the knockout layer follows it. */
  const reveal = useRef(1);
  const fsRef = useRef(0);
  const introPending = useRef(false);

  const applyReveal = useCallback((v: number) => {
    reveal.current = v;
    const box = boxRef.current;
    if (box) box.style.clipPath = v >= 1 ? '' : `inset(${((1 - v) * 100).toFixed(3)}% 0% 0% 0%)`;
  }, []);

  const applyImgIntro = useCallback(() => {
    const img = imgRef.current;
    if (img) img.style.transform = fx.intro >= 1 ? '' : `scale(${INTRO_ZOOM + (1 - INTRO_ZOOM) * fx.intro})`;
  }, []);

  /**
   * Knockout: the name is drawn twice. The bone layer has a hole where the portrait is,
   * the ink layer is clipped to exactly that rectangle, so the letters flip to ink over the photo.
   * Clip coordinates are in each layer's own (untransformed) box.
   */
  const syncKnockout = useCallback(() => {
    const box = boxRef.current;
    const main = nameRef.current;
    const ghost = ghostRef.current;
    if (!box || !main || !ghost) return;
    const f = box.getBoundingClientRect();
    const n = main.getBoundingClientRect();
    if (n.width < 1 || main.offsetWidth < 1) return;
    const sx = main.offsetWidth / n.width;
    const sy = main.offsetHeight / n.height;
    const top = f.top + f.height * (1 - reveal.current);
    const l = (f.left - n.left) * sx;
    const r = (f.right - n.left) * sx;
    const t = (top - n.top) * sy;
    const b = (f.bottom - n.top) * sy;
    const px = (v: number) => `${v.toFixed(1)}px`;
    if (r - l < 1 || b - t < 1 || b <= 0 || t >= main.offsetHeight) {
      ghost.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      main.style.clipPath = '';
      return;
    }
    ghost.style.clipPath = `polygon(${px(l)} ${px(t)}, ${px(r)} ${px(t)}, ${px(r)} ${px(b)}, ${px(l)} ${px(b)})`;
    main.style.clipPath =
      `polygon(evenodd, -50% -50%, 150% -50%, 150% 150%, -50% 150%, -50% -50%, ` +
      `${px(l)} ${px(t)}, ${px(l)} ${px(b)}, ${px(r)} ${px(b)}, ${px(r)} ${px(t)}, ${px(l)} ${px(t)})`;
  }, []);

  /* ----------------------------------------------- fit the name to the viewport */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const main = nameRef.current;
    const section = sectionRef.current;
    if (!stage || !main || !section) return;

    const fit = () => {
      const words = Array.from(main.querySelectorAll<HTMLElement>('[data-word]'));
      section.querySelectorAll<HTMLElement>('[data-char]').forEach((c) => (c.style.fontVariationSettings = ''));
      stage.style.setProperty('--fs', '100px');
      const widths = words.map((w) => w.offsetWidth);
      const avail = main.clientWidth;
      if (!avail || widths.some((w) => !w)) return;
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      let fs = mobile
        ? (avail / Math.max(...widths)) * 100
        : ((avail * 0.94) / (widths.reduce((a, b) => a + b, 0) + 24)) * 100;
      fs = Math.min(fs, window.innerHeight * (mobile ? 0.21 : 0.42));
      fs = Math.floor(fs * 10) / 10;
      fsRef.current = fs;
      stage.style.setProperty('--fs', `${fs}px`);
      syncKnockout();
    };

    fit();
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(stage);
    let alive = true;
    void document.fonts.ready.then(() => {
      if (!alive) return;
      fit();
      ScrollTrigger.refresh();
    });
    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [syncKnockout]);

  /* ------------------------------------------------- knockout follows every frame */
  useEffect(() => {
    if (!inView) return;
    gsap.ticker.add(syncKnockout);
    return () => gsap.ticker.remove(syncKnockout);
  }, [inView, syncKnockout]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  /* ------------------------------------------------------------ pointer tracking */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      fx.px = e.clientX;
      fx.py = e.clientY;
      fx.pointer = true;
      fx.mouse = e.pointerType !== 'touch';
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) fx.pointer = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseout', onOut);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  /* ------------------ shatter (click / tap & hold) + touch source lens on the portrait */
  useEffect(() => {
    const section = sectionRef.current;
    const box = boxRef.current;
    if (!section || !box) return;

    let busy = false;
    let tl: gsap.core.Timeline | null = null;
    let holdTimer = 0;
    let cooldown = 0;
    let touchId: number | null = null;
    let downX = 0;
    let downY = 0;

    const overPortrait = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      return inside && !(e.target instanceof Element && e.target.closest('a, button'));
    };

    const shatter = (x: number, y: number) => {
      // debounced: one break → hold → reassemble cycle at a time
      if (busy || !glLive.current || fx.scroll > 0.3) return;
      busy = true;
      fx.sx = x;
      fx.sy = y;
      fx.shatterId += 1;
      fx.shatter = 0;
      fx.crack = 0;
      fx.flash = 1;
      sfx.shatter();
      tl = gsap
        .timeline({
          onComplete: () => {
            fx.shatter = 0;
            fx.crack = 0;
            fx.flash = 0;
            cooldown = window.setTimeout(() => (busy = false), 220);
          },
        })
        // crack lines first, a beat before the plates move
        .to(fx, { crack: 1, duration: 0.08, ease: 'power2.out' }, 0)
        .to(fx, { flash: 0, duration: 0.7, ease: 'power3.out' }, 0)
        .to(fx, { shatter: 1, duration: 0.85, ease: 'expo.out' }, 0.05)
        .call(() => sfx.reform(), undefined, 1.2)
        .to(fx, { shatter: 0, duration: 1.5, ease: 'elastic.out(1, 0.45)' }, 1.2)
        .to(fx, { crack: 0, duration: 0.55, ease: 'power2.inOut' }, 2.05);
    };

    const onDown = (e: PointerEvent) => {
      if (!glLive.current || !overPortrait(e)) return;
      fx.px = e.clientX;
      fx.py = e.clientY;
      fx.pointer = true;
      if (e.pointerType === 'touch') {
        fx.mouse = false;
        touchId = e.pointerId;
        downX = e.clientX;
        downY = e.clientY;
        fx.lensHold = true;
        window.clearTimeout(holdTimer);
        holdTimer = window.setTimeout(() => {
          if (touchId !== null) shatter(fx.px, fx.py);
        }, HOLD_MS);
      } else if (e.button === 0) {
        shatter(e.clientX, e.clientY);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) window.clearTimeout(holdTimer);
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== touchId) return;
      touchId = null;
      window.clearTimeout(holdTimer);
      fx.lensHold = false;
      fx.lensUntil = performance.now() + 450;
    };
    // a long press must not open the image / selection callout
    const onMenu = (e: Event) => {
      if (touchId !== null) e.preventDefault();
    };

    section.addEventListener('pointerdown', onDown);
    section.addEventListener('contextmenu', onMenu);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onEnd, { passive: true });
    window.addEventListener('pointercancel', onEnd, { passive: true });
    return () => {
      section.removeEventListener('pointerdown', onDown);
      section.removeEventListener('contextmenu', onMenu);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.clearTimeout(holdTimer);
      window.clearTimeout(cooldown);
      tl?.kill();
      fx.shatter = 0;
      fx.crack = 0;
      fx.flash = 0;
      fx.lensHold = false;
    };
  }, []);

  /* --------------------------------- cursor proximity: wdth/wght swell near pointer */
  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const main = nameRef.current;
    const ghost = ghostRef.current;
    if (!main || !ghost) return;
    const a = Array.from(main.querySelectorAll<HTMLElement>('[data-char]'));
    const b = Array.from(ghost.querySelectorAll<HTMLElement>('[data-char]'));
    const cur = a.map(() => 0);
    let raf = 0;

    const tick = () => {
      raf = 0;
      const radius = Math.max(fsRef.current, 80) * 1.15;
      // read all rects first, then write — one layout per frame
      const targets = a.map((el) => {
        if (!fx.pointer) return 0;
        const r = el.getBoundingClientRect();
        const dx = fx.px - (r.left + r.width / 2);
        const dy = (fx.py - (r.top + r.height / 2)) * 1.3;
        const t = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
        return t * t * (3 - 2 * t);
      });
      let moving = false;
      for (let i = 0; i < a.length; i++) {
        let v = cur[i] + (targets[i] - cur[i]) * 0.15;
        if (Math.abs(targets[i] - v) < 0.002) v = targets[i];
        else moving = true;
        cur[i] = v;
        const val = v < 0.001 ? '' : axes(v);
        a[i].style.fontVariationSettings = val;
        if (b[i]) b[i].style.fontVariationSettings = val;
      }
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', kick, { passive: true });
    window.addEventListener('scroll', kick, { passive: true });
    document.addEventListener('mouseout', kick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', kick);
      window.removeEventListener('scroll', kick);
      document.removeEventListener('mouseout', kick);
    };
  }, []);

  /* -------------------------------------- intro: hidden initial states (pre-loader) */
  useGSAP(
    () => {
      if (prefersReducedMotion() || useSite.getState().loaded) return;
      introPending.current = true;
      gsap.set('[data-char]', { yPercent: 118 });
      gsap.set('[data-meta]', { autoAlpha: 0, y: 14 });
      gsap.set('[data-split]', { autoAlpha: 0 });
      applyReveal(0);
      fx.intro = 0;
      applyImgIntro();
    },
    { scope: sectionRef },
  );

  /* -------------------------------------------------- intro: play once loaded */
  useGSAP(
    () => {
      if (!loaded || !introPending.current) return;
      introPending.current = false;
      const section = sectionRef.current;
      if (!section) return;

      const mainChars = section.querySelectorAll('[data-char="main"]');
      const ghostChars = section.querySelectorAll('[data-char="ghost"]');
      const r = { v: reveal.current };
      const splits: SplitText[] = [];

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => splits.forEach((s) => s.revert()),
      });
      tl.to(mainChars, { yPercent: 0, duration: 1.35, stagger: 0.028 }, 0)
        .to(ghostChars, { yPercent: 0, duration: 1.35, stagger: 0.028 }, 0)
        .to(r, { v: 1, duration: 1.5, ease: 'expo.inOut', onUpdate: () => applyReveal(r.v) }, 0.05)
        .to(fx, { intro: 1, duration: 2.1, ease: 'expo.out', onUpdate: applyImgIntro }, 0.35)
        .to('[data-meta]', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.05 }, 0.8);

      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el, i) => {
        const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
        splits.push(split);
        const at = 0.6 + i * 0.14;
        tl.set(el, { autoAlpha: 1 }, at).from(split.lines, { yPercent: 105, duration: 1.15, stagger: 0.09 }, at);
      });
    },
    { dependencies: [loaded], scope: sectionRef },
  );

  // Belt and braces: never leave the hero hidden if the preloader somehow stalls.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!useSite.getState().loaded) useSite.getState().setLoaded();
    }, 7000);
    return () => window.clearTimeout(id);
  }, []);

  /* ------------------------------ scroll-out: pinned for 60vh, scrubbed choreography */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const section = sectionRef.current;
      const main = nameRef.current;
      const ghost = ghostRef.current;
      if (!section || !main || !ghost) return;

      const tl = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=60%',
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(fx, { scroll: 1 }, 0)
        .to('[data-word="0"]', { x: () => -window.innerWidth * 0.11 }, 0)
        .to('[data-word="1"]', { x: () => window.innerWidth * 0.09 }, 0)
        .to(nameWrapRef.current, { scale: 1.06, transformOrigin: '50% 100%' }, 0)
        .to(copyRef.current, { y: -70, autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 0)
        .to([frameHeadRef.current, hintRef.current].filter(Boolean), { autoAlpha: 0, duration: 0.3 }, 0)
        .to(bottomRef.current, { autoAlpha: 0, y: 24, duration: 0.3 }, 0)
        .to(ghost, { color: getComputedStyle(main).color, duration: 0.3 }, 0.42)
        // DOM fallback only (the canvas covers it when WebGL is on)
        .to(imgWrapRef.current, { scale: 1.14, autoAlpha: 0, transformOrigin: '50% 40%' }, 0);

      // ambient details
      gsap.to(dotRef.current, { opacity: 0.25, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap
        .timeline({ repeat: -1, repeatDelay: 0.3 })
        .fromTo(cueRef.current, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.9, ease: 'expo.inOut' })
        .to(cueRef.current, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.9, ease: 'expo.inOut' }, '+=0.15');
    },
    { scope: sectionRef },
  );

  const nameStyle = { fontVariationSettings: REST, fontWeight: 500, fontSize: 'inherit' } as const;

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Introduction"
      className="relative h-[100svh] min-h-[600px] overflow-clip bg-ink"
    >
      <div
        ref={stageRef}
        className={cn(
          'gutter relative flex h-full flex-col [--fs:28vw]',
          'pt-[calc(env(safe-area-inset-top,0px)+76px)] pb-[max(18px,env(safe-area-inset-bottom))]',
          'md:grid md:grid-cols-12 md:grid-rows-[minmax(0,1fr)_auto_auto] md:gap-x-6 md:[--fs:15vw]',
          'md:pt-[calc(env(safe-area-inset-top,0px)+108px)] md:pb-[max(24px,env(safe-area-inset-bottom))]',
        )}
      >
        {/* ------------------------------------------------------- copy */}
        <div
          ref={copyRef}
          className="relative z-[2] flex shrink-0 flex-col md:col-span-5 md:row-start-1 md:justify-between md:pb-10"
        >
          <div>
            <p data-meta className="label">
              {EDUCATION}
            </p>
            <p data-split className="display mt-4 text-[clamp(34px,4.3vw,74px)] text-bone md:mt-6">
              {ROLE_HEAD} <span className="serif-i">{ROLE_TAIL}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <p
              data-split
              className="max-w-[34ch] text-[15px] leading-[1.5] text-bone/75 md:text-[17px] [@media(max-width:767px)_and_(max-height:700px)]:hidden"
            >
              {tagline}
            </p>
            <p data-meta className="label mt-4 flex items-center gap-2.5 text-bone md:mt-6">
              <span ref={dotRef} aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-ochre" />
              {AVAILABILITY}
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------ portrait */}
        <div
          className="relative z-[1] mt-5 flex min-h-[140px] flex-1 flex-col md:col-span-7 md:col-start-6 md:row-start-1 md:mt-0"
          style={{ marginBottom: 'calc(var(--fs) * -0.5)' }}
        >
          <div ref={frameHeadRef} className="flex items-center justify-between pb-3">
            <span data-meta className="label">
              Fig. 01 — Portrait
            </span>
            <span data-meta className="label">
              Pune, {education.state}
            </span>
          </div>
          <div className="relative min-h-0 flex-1">
            <div
              ref={boxRef}
              // the source lens is the cursor over the live portrait
              data-cursor={glOn && glReady && fine ? 'hide' : undefined}
              className={cn(
                'absolute inset-0 overflow-hidden bg-ink',
                glOn && 'select-none [-webkit-touch-callout:none]',
              )}
            >
              <div ref={imgWrapRef} className="absolute inset-0">
                <img
                  ref={imgRef}
                  src={PORTRAIT_SRC}
                  alt="Yash Hogade in a white shirt and dark sunglasses, seated in front of an ochre lime-washed wall"
                  width={1448}
                  height={1086}
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${PORTRAIT_FOCUS.x * 100}% ${PORTRAIT_FOCUS.y * 100}%` }}
                />
              </div>
              {glOn && (
                <GLBoundary onError={() => setGlOn(false)}>
                  <Suspense fallback={null}>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 transition-opacity duration-700"
                      style={{ opacity: glReady ? 1 : 0 }}
                    >
                      <PortraitCanvas
                        fx={fx}
                        src={PORTRAIT_SRC}
                        active={inView}
                        palette={palette}
                        onReady={() => setGlReady(true)}
                        onError={() => setGlOn(false)}
                      />
                    </div>
                  </Suspense>
                </GLBoundary>
              )}
            </div>
            {/* interaction hint (only where the lens / shatter actually exist) */}
            {glOn && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-2.5 z-[1] max-w-[calc(100%-20px)] transition-opacity duration-700 md:left-3.5 md:top-3.5"
                style={{ opacity: glReady ? 1 : 0 }}
              >
                <div ref={hintRef}>
                  <span
                    data-meta
                    className="label flex items-center gap-2 bg-ink px-2 py-1.5 text-[10px] leading-none tracking-[0.14em] text-bone/85"
                  >
                    <span className="h-[5px] w-[5px] shrink-0 bg-ochre" />
                    {fine ? 'Click to break · move to read the source' : 'Tap & hold'}
                  </span>
                </div>
              </div>
            )}
            {/* crop marks */}
            {(['-left-2 -top-2 border-l border-t', '-right-2 -top-2 border-r border-t', '-left-2 -bottom-2 border-b border-l', '-right-2 -bottom-2 border-b border-r'] as const).map(
              (pos) => (
                <span
                  key={pos}
                  data-meta
                  aria-hidden="true"
                  className={cn('pointer-events-none absolute hidden h-2.5 w-2.5 border-mute/60 md:block', pos)}
                />
              ),
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------- name */}
        <div
          ref={nameWrapRef}
          className="relative z-[2] mt-0 md:col-span-12 md:row-start-2"
          style={{ fontSize: 'var(--fs)' }}
        >
          <h1
            ref={nameRef}
            className="display flex flex-col whitespace-nowrap text-bone md:flex-row md:items-end md:justify-between"
            style={nameStyle}
          >
            <span className="sr-only">{name}</span>
            <NameWords />
          </h1>
          <div
            ref={ghostRef}
            aria-hidden="true"
            className="display pointer-events-none absolute inset-0 flex flex-col whitespace-nowrap text-ink md:flex-row md:items-end md:justify-between"
            style={{ ...nameStyle, clipPath: 'polygon(0 0, 0 0, 0 0)' }}
          >
            <NameWords ghost />
          </div>
        </div>

        {/* ---------------------------------------------------- bottom rail */}
        <div
          ref={bottomRef}
          className="relative z-[2] flex items-center justify-between gap-4 pt-4 md:col-span-12 md:row-start-3 md:pt-5"
        >
          <span data-meta className="label">
            {COORDS}
          </span>
          <span data-meta className="label hidden lg:inline">
            {role} — {education.city}, IN
          </span>
          <a
            data-meta
            href="#work"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget('#work');
            }}
            className="label flex items-center gap-3 py-2 text-bone"
          >
            Scroll
            <span aria-hidden="true" className="relative block h-px w-10 overflow-hidden bg-line">
              <span ref={cueRef} className="absolute inset-0 block bg-bone" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
