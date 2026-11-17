import { useEffect, useRef, useState } from 'react';
import { motionValue } from 'motion/react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { sfx } from '../../lib/sound';
import { PerspectiveText } from '@/vendor/skiper/skiper28';
import { ScatterText } from '@/vendor/skiper/skiper31';
import PortraitCylinder from './PortraitCylinder';
import OrbitAct from './OrbitAct';
import { createCylinder } from './cylinder';
import { ACTS, COORDS, STATEMENT, STATEMENT_TEXT, pad } from './content';

/*
 * One pinned stage, three acts layered on top of each other, one scrubbed GSAP timeline.
 * Timeline time is in "beats" (0 → 10); the pin length maps them onto scroll.
 *
 *   0.0 ─ 3.3   Act 1  Portrait cylinder: column → flat photo (hold at 1.65) → curls apart
 *   3.1 ─ 6.8   Act 2  Statement: lines rush in from the depth of a tunnel, hold, blow past
 *   6.5 ─ 10    Act 3  Work in orbit: ring of projects turns with scroll around a preview
 */
const BEATS = 10;
const ACT1_END = 3.3;
const LINE_AT = (i: number) => 3.15 + i * 0.5;
const LINE_DUR = 0.9;
const BLOCK_OUT = 6.15;
const ACT3_AT = 6.5;
const ACT_BREAKS = [3.2, 6.55];

const TUNNEL_FRAMES = 7;
const TUNNEL_DEPTH = 3200;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

interface CinematicProps {
  mobile: boolean;
  /** Cursor tilts the cylinder (fine pointers, desktop only). */
  tilt: boolean;
}

export default function Cinematic({ mobile, tilt }: CinematicProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const act1Ref = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLParagraphElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const act3Ref = useRef<HTMLDivElement>(null);
  const hudNumRef = useRef<HTMLSpanElement>(null);
  const hudLabelRef = useRef<HTMLSpanElement>(null);
  const hudBarRef = useRef<HTMLSpanElement>(null);
  const ringRotation = useRef(0);

  // Motion values for the vendored motion/react pieces, written by the GSAP timeline.
  // Resting values = readable/visible, so nothing is stuck hidden if the timeline never runs.
  const [mv] = useState(() => ({
    plane: motionValue(1),
    lines: STATEMENT.map(() => motionValue(0.5)),
    reveal: motionValue(1),
  }));

  const strips = mobile ? 12 : 24;
  const aspect = mobile ? 0.8 : 1448 / 1086;
  const frameWidth = mobile ? 'min(80vw, calc(56svh * 0.8))' : 'min(76vw, calc(62svh * 1.3333), 1080px)';

  useGSAP(
    () => {
      const root = rootRef.current;
      const stage = stageRef.current;
      const frame = frameRef.current;
      if (!root || !stage || !frame) return;

      const cylinder = createCylinder(frame);
      const lines = gsap.utils.toArray<HTMLElement>('[data-line]', root);
      const tunnel = gsap.utils.toArray<HTMLElement>('[data-tunnel]', root);
      let entry = 1;
      let act = -1;

      const render = (t: number) => {
        // Act 1 — cylinder pose, ghost name drift, caption only while assembled.
        const p1 = ramp(t, 0, ACT1_END);
        const e = cylinder.render(p1, -entry * 0.6);
        if (ghostRef.current) ghostRef.current.style.transform = `translate3d(${((0.5 - p1) * 10).toFixed(2)}vw,0,0)`;
        if (captionRef.current) {
          captionRef.current.style.opacity = clamp01(1 - e * 2.6).toFixed(3);
          captionRef.current.style.transform = `translate3d(0,${(e * 18).toFixed(1)}px,0)`;
        }

        // Act 2 — plane settles (Skiper 28), characters converge (Skiper 31), tunnel streams past.
        mv.plane.set(ramp(t, 3.05, 5.5));
        STATEMENT.forEach((_, i) => mv.lines[i].set(ramp(t, LINE_AT(i), LINE_AT(i) + LINE_DUR) * 0.5));
        const gate = ramp(t, 2.9, 3.4) * (1 - ramp(t, 6.3, 6.9));
        const travel = ramp(t, 2.9, 6.9) * 1.7;
        tunnel.forEach((el, i) => {
          const f = (i / TUNNEL_FRAMES + travel) % 1; // 0 = deepest, 1 = at the camera
          const z = -TUNNEL_DEPTH + f * (TUNNEL_DEPTH + 420);
          const o = Math.min(1, f * 3) * (1 - ramp(f, 0.82, 1)) * gate;
          el.style.transform = `translate3d(0,0,${z.toFixed(1)}px)`;
          el.style.opacity = o.toFixed(3);
        });

        // Act 3 — ring rotation and preview reveal (Skiper 34).
        ringRotation.current = -Math.max(0, t - ACT3_AT) * 95;
        mv.reveal.set(ramp(t, ACT3_AT + 0.15, ACT3_AT + 1.05));

        // HUD
        const next = t < ACT_BREAKS[0] ? 0 : t < ACT_BREAKS[1] ? 1 : 2;
        if (next !== act) {
          if (act !== -1) sfx.whoosh();
          act = next;
          if (hudNumRef.current) hudNumRef.current.textContent = pad(next + 1);
          if (hudLabelRef.current) hudLabelRef.current.textContent = ACTS[next];
        }
        if (hudBarRef.current) hudBarRef.current.style.transform = `scaleX(${(t / BEATS).toFixed(4)})`;
      };

      // Built paused first; the ScrollTrigger below scrubs it (so callbacks never see it undefined).
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      tl.eventCallback('onUpdate', () => render(tl.time()));

      // Act 1 out: the curled column sinks back as the statement arrives.
      tl.to(act1Ref.current, { autoAlpha: 0, scale: 0.82, duration: 0.5, ease: 'power2.in' }, ACT1_END - 0.35);

      // Act 2: each line rushes forward out of the tunnel into its slot and rests there.
      lines.forEach((line, i) => {
        tl.from(line, { z: -2600, autoAlpha: 0, duration: LINE_DUR, ease: 'power3.out' }, LINE_AT(i));
      });
      // …then the whole statement blows past the camera.
      tl.to(blockRef.current, { z: 640, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, BLOCK_OUT);

      // Act 3: the orbit pulls back into view.
      tl.from(act3Ref.current, { autoAlpha: 0, scale: 1.22, duration: 0.7, ease: 'power3.out' }, ACT3_AT);
      tl.to({}, { duration: 0.001 }, BEATS - 0.001); // pad the timeline to exactly BEATS

      ScrollTrigger.create({
        animation: tl,
        trigger: stage,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (mobile ? 1 : 2.6))}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => {
          cylinder.measure();
          render(tl.time());
        },
      });

      // Before the pin: the column turns as the section scrolls into view.
      const syncEntry = (self: ScrollTrigger) => {
        entry = 1 - self.progress;
        render(tl.time());
      };
      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'top top',
        onUpdate: syncEntry,
        onRefresh: syncEntry,
      });

      render(tl.time());

      // Cursor tilts the cylinder, subtly.
      if (tilt && tiltRef.current) {
        const rotY = gsap.quickTo(tiltRef.current, 'rotationY', { duration: 1.2, ease: 'power3.out' });
        const rotX = gsap.quickTo(tiltRef.current, 'rotationX', { duration: 1.2, ease: 'power3.out' });
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerType !== 'mouse') return;
          rotY((ev.clientX / window.innerWidth - 0.5) * 14);
          rotX((ev.clientY / window.innerHeight - 0.5) * -10);
        };
        const onLeave = () => {
          rotY(0);
          rotX(0);
        };
        stage.addEventListener('pointermove', onMove);
        stage.addEventListener('pointerleave', onLeave);
        return () => {
          stage.removeEventListener('pointermove', onMove);
          stage.removeEventListener('pointerleave', onLeave);
        };
      }
    },
    { scope: rootRef },
  );

  // The pin changes page height: re-sort and re-measure everything once it exists.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={rootRef}>
      <h2 id="interlude-title" className="sr-only">
        {STATEMENT_TEXT}
      </h2>

      <div ref={stageRef} className="relative h-svh w-full overflow-hidden bg-ink">
        {/* ── Act 1 — Portrait cylinder ───────────────────────────── */}
        <div ref={act1Ref} className="absolute inset-0 flex items-center justify-center">
          <p
            ref={ghostRef}
            aria-hidden="true"
            className="display pointer-events-none absolute select-none whitespace-nowrap text-[clamp(7rem,24vw,26rem)] text-ink-3"
          >
            Yash Hogade
          </p>
          <div className="relative flex flex-col items-center gap-[clamp(14px,2.4svh,24px)]">
            <div style={{ perspective: '1600px' }}>
              <div ref={tiltRef} className="[transform-style:preserve-3d]">
                <PortraitCylinder strips={strips} aspect={aspect} width={frameWidth} frameRef={frameRef} />
              </div>
            </div>
            <div
              ref={captionRef}
              className="label flex flex-wrap justify-between gap-x-6 gap-y-1 tabular-nums"
              style={{ width: frameWidth }}
            >
              <span>
                <span className="text-ochre">Fig. 01</span> — Yash Hogade
              </span>
              <span>Pune · {COORDS}</span>
            </div>
          </div>
        </div>

        {/* ── Act 2 — Statement through a perspective tunnel ──────── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <PerspectiveText
            progress={mv.plane}
            perspective={mobile ? 700 : 900}
            tilt={28}
            lift={16}
            className="flex h-full w-full items-center justify-center"
            backdrop={
              <div className="absolute inset-0 [transform-style:preserve-3d]">
                {Array.from({ length: TUNNEL_FRAMES }, (_, i) => (
                  <div
                    key={i}
                    data-tunnel
                    className={
                      i === 0
                        ? 'absolute inset-[9%_6%] border border-ochre/45 opacity-0'
                        : 'absolute inset-[9%_6%] border border-line opacity-0'
                    }
                  />
                ))}
              </div>
            }
          >
            <div
              ref={blockRef}
              className="display text-center text-[min(11.5vw,14.5svh)] text-bone [transform-style:preserve-3d]"
            >
              {STATEMENT.map((line, i) => (
                <div key={line.text} data-line className="block">
                  <ScatterText
                    text={line.text}
                    progress={mv.lines[i]}
                    className={line.serif ? 'serif-i pr-[0.08em] text-[1.14em] leading-[0.92] text-ochre' : undefined}
                  />
                </div>
              ))}
            </div>
          </PerspectiveText>
        </div>

        {/* ── Act 3 — Work in orbit ───────────────────────────────── */}
        <div ref={act3Ref} className="absolute inset-0">
          <OrbitAct rotationRef={ringRotation} reveal={mv.reveal} compact={mobile} />
        </div>

        {/* ── HUD ─────────────────────────────────────────────────── */}
        <div className="gutter label pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-20 flex items-center gap-3 tabular-nums">
          <span className="text-bone">
            <span ref={hudNumRef}>01</span> / {pad(ACTS.length)}
          </span>
          <span className="relative h-px w-12 overflow-hidden bg-line sm:w-20">
            <span
              ref={hudBarRef}
              className="absolute inset-0 origin-left bg-ochre"
              style={{ transform: 'scaleX(0)' }}
            />
          </span>
          <span ref={hudLabelRef}>{ACTS[0]}</span>
        </div>
      </div>
    </div>
  );
}
