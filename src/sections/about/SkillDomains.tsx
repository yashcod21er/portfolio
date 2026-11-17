import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';
import type { SkillCategory } from '../../types/portfolio';
import Mask from './Mask';
import { queueRefresh, revealRows } from './motion';

const pad = (n: number) => String(n).padStart(2, '0');
const now = () => performance.now();

/** How long the pointer must rest on a row before it opens, and how long to wait out a reflow. */
const DWELL = 140;
const SETTLE = 650;

/**
 * The five domains as hairline rows. Fine pointers open a row by resting on it; everyone else
 * (touch, keyboard) toggles it. One row open at a time.
 */
export default function SkillDomains({ domains }: { domains: SkillCategory[] }) {
  const root = useRef<HTMLUListElement>(null);
  const uid = useId();
  const [open, setOpen] = useState<string | null>(null);

  // Hover-intent bookkeeping (refs: none of this should re-render).
  const hovered = useRef<string | null>(null);
  const suppressed = useRef<string | null>(null); // closed by click: ignore hover until the pointer leaves
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef(false);
  const lockUntil = useRef(0);
  const lastScroll = useRef(0);
  const openRef = useRef(open);

  const commit = useCallback((id: string | null) => {
    lockUntil.current = now() + SETTLE;
    openRef.current = id;
    setOpen(id);
    queueRefresh(SETTLE + 150);
  }, []);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    pending.current = true;
    timer.current = window.setTimeout(function check() {
      const t = now();
      if (t < lockUntil.current) {
        timer.current = window.setTimeout(check, lockUntil.current - t + 20);
        return;
      }
      pending.current = false;
      const id = hovered.current;
      if (id && id !== openRef.current && id !== suppressed.current) commit(id);
    }, DWELL);
  }, [commit]);

  useEffect(() => {
    const onScroll = () => (lastScroll.current = now());
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer.current);
    };
  }, []);

  const onMove = (id: string, pointerType: string) => {
    if (pointerType !== 'mouse' || !isFinePointer()) return;
    // Rows sliding under a still cursor while the page scrolls aren't intent.
    if (now() - lastScroll.current < 220) return;
    if (suppressed.current === id) return;
    if (hovered.current !== id) {
      hovered.current = id;
      schedule();
    } else if (openRef.current !== id && !pending.current) {
      schedule();
    }
  };

  const onLeave = (id: string) => {
    if (hovered.current === id) hovered.current = null;
    if (suppressed.current === id) suppressed.current = null;
  };

  const onClick = (id: string, e: MouseEvent) => {
    const isOpen = openRef.current === id;
    // Mouse on a fine pointer: the hover already opened it, so a click right after shouldn't undo it.
    if (e.detail !== 0 && isFinePointer()) {
      if (!isOpen) commit(id);
      else if (now() > lockUntil.current) {
        suppressed.current = id;
        commit(null);
      }
      return;
    }
    // Keyboard (detail 0) and touch: plain toggle.
    commit(isOpen ? null : id);
  };

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      revealRows(gsap.utils.toArray<HTMLElement>('[data-row]', root.current), 'top 92%');
    },
    { scope: root },
  );

  return (
    <ul ref={root} className="ab-doms relative border-b border-line">
      {domains.map((d) => {
        const isOpen = open === d.id;
        const panelId = `${uid}-${d.id}`;
        return (
          <li
            key={d.id}
            data-row
            data-open={isOpen}
            className="ab-dom relative"
            onPointerMove={(e) => onMove(d.id, e.pointerType)}
            onPointerLeave={() => onLeave(d.id)}
          >
            <span data-line aria-hidden className="absolute inset-x-0 top-0 h-px bg-line" />
            <h4 className="m-0">
              <button
                type="button"
                data-cursor="link"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={(e) => onClick(d.id, e)}
                className="ab-dom-btn grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 py-6 text-left md:grid-cols-[minmax(0,6fr)_minmax(0,4fr)_6rem_auto] md:py-9"
              >
                <span className="ab-dom-name block text-bone">
                  <Mask>{d.name}</Mask>
                </span>
                <span className="label col-start-1 row-start-2 md:col-start-2 md:row-start-1">
                  <Mask>
                    {d.tag}
                    <span className="md:hidden"> · {pad(d.skills.length)}</span>
                  </Mask>
                </span>
                <span className="label hidden text-right md:block">
                  <Mask>{pad(d.skills.length)} skills</Mask>
                </span>
                <span className="col-start-2 row-start-1 text-bone md:col-start-4">
                  <span className="ab-plus" aria-hidden />
                </span>
              </button>
            </h4>

            <div
              id={panelId}
              role="region"
              aria-label={`${d.name} skills`}
              className="ab-dom-panel"
              inert={!isOpen}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="pb-10 md:grid md:grid-cols-[minmax(0,6fr)_minmax(0,4fr)_6rem_auto] md:gap-x-6 md:pb-14">
                  <div className="md:col-span-3 md:col-start-2">
                    <ul className="grid gap-x-8 sm:grid-cols-2">
                      {d.skills.map((s, i) => (
                        <li
                          key={s.name}
                          className="ab-skill border-t border-line py-4"
                          style={{ '--i': i } as CSSProperties}
                        >
                          <p className="ab-val text-bone">{s.name}</p>
                          {!!s.tags?.length && (
                            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`${s.name} focus`}>
                              {s.tags.map((t) => (
                                <li
                                  key={t}
                                  className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-mute uppercase"
                                >
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
