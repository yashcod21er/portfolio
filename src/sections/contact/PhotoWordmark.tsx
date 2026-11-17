import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';
import { ClipSvg } from '../../vendor/skiper/skiper66';

/**
 * The giant footer "HOGADE", cut out of Yash's portrait (skiper66 SVG clip-path, all-SVG
 * variant). Letters are <text> nodes inside the clipPath, so the photo only shows through
 * the glyphs.
 *  - Rise: letters lift from below as the page ends (scrubbed, from the centre out).
 *  - Pan: the photo tilts up through the frame with scroll and comes to rest on the
 *    sunglasses; it leans toward the cursor and eases in a little while hovered.
 * Reduced motion: no rise, no pan; a still crop on the sunglasses.
 */

const WORD = 'HOGADE';
const SRC = '/assets/yash-portrait.webp';
const PHOTO_ASPECT = 1448 / 1086;
/** em-based tracking applied manually (font-size 100 → -2 units per glyph) */
const TRACK = -2;
/** where the crop centre sits in the photo: scroll start → rest (the sunglasses ≈ 0.38) */
const FOCAL_FROM = 0.7;
const FOCAL_REST = 0.39;
const FOCAL_X = 0.51;
const PHOTO_OVERSCAN = 1.18;
const PAD = 3;

const FVS = '"opsz" 96, "wdth" 75, "wght" 800';
const FONT_STYLE = { fontVariationSettings: FVS, fontWeight: 800, fontSize: 100 } as const;

interface Metrics {
  /** x of each glyph at font-size 100 (tracking applied) */
  xs: number[];
  width: number;
  /** cap ascent / overshoot below the baseline */
  ascent: number;
  descent: number;
}

/** Ink extents of the caps; canvas ignores the wdth axis but vertical metrics don't depend on it. */
function capMetrics() {
  try {
    const c = document.createElement('canvas').getContext('2d');
    if (!c) throw new Error('no 2d');
    c.font = '800 100px "Bricolage Grotesque"';
    const m = c.measureText(WORD);
    if (m.actualBoundingBoxAscent > 40) return { ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
  } catch {
    /* fall through */
  }
  return { ascent: 72, descent: 2 };
}

function useWordMetrics(measureRef: RefObject<SVGTextElement | null>) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const t = measureRef.current;
      if (!alive || !t) return;
      try {
        const n = WORD.length;
        const xs = Array.from({ length: n }, (_, i) => t.getStartPositionOfChar(i).x + TRACK * i);
        const end = t.getEndPositionOfChar(n - 1).x + TRACK * (n - 1);
        if (!(end > 0)) return;
        const { ascent, descent } = capMetrics();
        setMetrics((prev) =>
          prev && Math.abs(prev.width - end) < 0.01 && prev.ascent === ascent ? prev : { xs, width: end, ascent, descent },
        );
      } catch {
        /* layout not ready; the fonts promise retries */
      }
    };
    measure();
    const fonts = document.fonts;
    fonts?.load('800 100px "Bricolage Grotesque"').then(measure, () => {});
    fonts?.ready.then(measure, () => {});
    return () => {
      alive = false;
    };
  }, [measureRef]);

  return metrics;
}

export default function PhotoWordmark({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const imageRef = useRef<SVGImageElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  const letterRefs = useRef<Array<SVGTextElement | null>>([]);
  const clipId = `wm-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const m = useWordMetrics(measureRef);

  // Geometry in viewBox units (baseline at y = 0).
  const W = m?.width ?? 0;
  const top = -(m?.ascent ?? 0) - PAD;
  const H = (m?.ascent ?? 0) + (m?.descent ?? 0) + PAD * 2;
  const IW = W * PHOTO_OVERSCAN;
  const IH = IW / PHOTO_ASPECT;

  const place = (focalY: number, dx: number, dy: number) => {
    const minX = W - IW;
    const minY = top + H - IH;
    const x = Math.min(0, Math.max(minX, W / 2 - FOCAL_X * IW + dx));
    const y = Math.min(top, Math.max(minY, top + H / 2 - focalY * IH + dy));
    return { x, y };
  };
  const rest = place(FOCAL_REST, 0, 0);

  // Tell ScrollTrigger the footer height changed once the real glyph metrics arrive.
  useEffect(() => {
    if (!m) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [m]);

  // Rise: scrubbed, from the centre out (same choreography as v2).
  useGSAP(
    () => {
      if (!m || prefersReducedMotion()) return;
      const letters = letterRefs.current.filter((l): l is SVGTextElement => !!l);
      const dist = H * 1.05;
      const proxies = letters.map(() => ({ v: 0 }));
      const write = () => {
        letters.forEach((l, i) => l.setAttribute('transform', `translate(0 ${(proxies[i].v * dist).toFixed(2)})`));
      };
      gsap
        .timeline({
          scrollTrigger: { trigger: wrapRef.current, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
          defaults: { ease: 'none' },
          onUpdate: write,
        })
        .fromTo(proxies, { v: 1 }, { v: 0, stagger: { each: 0.1, from: 'center' } }, 0);
      write();
      return () => letters.forEach((l) => l.removeAttribute('transform'));
    },
    { dependencies: [m], revertOnUpdate: true },
  );

  // Pan + cursor lean + hover zoom: one rAF loop, only while the wordmark is near the viewport.
  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imageRef.current;
    const zoom = zoomRef.current;
    if (!m || !wrap || !img || !zoom || prefersReducedMotion()) return;
    const fine = isFinePointer();

    const cur = { p: 0, mx: 0, my: 0, s: 1 };
    const tgt = { p: 0, mx: 0, my: 0, s: 1 };
    let raf = 0;
    let running = false;

    const readScroll = () => {
      const host = scrollRef.current ?? wrap;
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      tgt.p = Math.min(1, Math.max(0, (vh - r.top) / Math.max(1, r.height)));
    };

    const frame = () => {
      raf = 0;
      readScroll();
      let moving = false;
      (Object.keys(cur) as Array<keyof typeof cur>).forEach((k) => {
        const d = tgt[k] - cur[k];
        if (Math.abs(d) < 0.0005) cur[k] = tgt[k];
        else {
          cur[k] += d * (k === 'p' ? 0.12 : 0.08);
          moving = true;
        }
      });
      const focal = FOCAL_FROM + (FOCAL_REST - FOCAL_FROM) * cur.p;
      const { x, y } = place(focal, cur.mx * IW * 0.035, cur.my * IH * 0.04);
      img.setAttribute('x', x.toFixed(2));
      img.setAttribute('y', y.toFixed(2));
      const cx = W / 2;
      const cy = top + H / 2;
      zoom.setAttribute('transform', `translate(${cx} ${cy}) scale(${cur.s.toFixed(4)}) translate(${-cx} ${-cy})`);
      if (moving && running) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (running && !raf) raf = requestAnimationFrame(frame);
    };
    // start from wherever the page already is, so the photo never jumps on first frame
    readScroll();
    cur.p = tgt.p;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      tgt.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      tgt.my = (e.clientY / window.innerHeight - 0.5) * 2;
      const r = wrap.getBoundingClientRect();
      const over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      tgt.s = over ? 1.06 : 1;
      kick();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) {
          window.addEventListener('scroll', kick, { passive: true });
          if (fine) window.addEventListener('pointermove', onMove, { passive: true });
          kick();
        } else {
          window.removeEventListener('scroll', kick);
          window.removeEventListener('pointermove', onMove);
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: '20% 0px' },
    );
    io.observe(wrap);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('pointermove', onMove);
    };
    // place() only closes over values derived from m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, scrollRef]);

  return (
    <div ref={wrapRef} className="relative" aria-hidden="true">
      {/* Off-screen measuring text: same font settings, no tracking */}
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" style={{ visibility: 'hidden' }} focusable="false">
        <text ref={measureRef} x="0" y="100" className="font-display" style={FONT_STYLE}>
          {WORD}
        </text>
      </svg>

      {m ? (
        <ClipSvg
          id={clipId}
          viewBox={`0 ${top.toFixed(2)} ${W.toFixed(2)} ${H.toFixed(2)}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-auto w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
          shape={WORD.split('').map((ch, i) => (
            <text
              key={i}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              x={m.xs[i].toFixed(2)}
              y="0"
              className="font-display"
              style={FONT_STYLE}
            >
              {ch}
            </text>
          ))}
        >
          <rect x="0" y={top} width={W} height={H} style={{ fill: 'var(--color-ochre-deep)' }} />
          <g ref={zoomRef}>
            <image
              ref={imageRef}
              href={SRC}
              x={rest.x.toFixed(2)}
              y={rest.y.toFixed(2)}
              width={IW.toFixed(2)}
              height={IH.toFixed(2)}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        </ClipSvg>
      ) : (
        // Space holder until the display face has been measured (≈ HOGADE at wdth 75 / wght 800)
        <div className="w-full" style={{ aspectRatio: '4.3 / 1' }} />
      )}
    </div>
  );
}
