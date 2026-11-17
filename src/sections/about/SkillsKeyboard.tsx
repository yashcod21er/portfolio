import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { isFinePointer, prefersReducedMotion } from '../../lib/smooth';
import { sfx } from '../../lib/sound';
import { useSite } from '../../lib/store';
import { skillsData } from '../../data/skillsData';
import {
  InteractiveKeyboard,
  type InteractiveKeyboardHandle,
  type KeyLegend,
  type KeyPressSource,
} from '../../vendor/vengeance/interactive-keyboard';
import Mask from './Mask';
import { riseIn } from './motion';

interface BoundSkill {
  key: string;
  name: string;
  domains: { name: string; tag: string }[];
  tags: string[];
}

/** Mnemonic key for each skill. Anything new in skillsData falls back to a spare letter. */
const PREFERRED: Record<string, string> = {
  HTML5: 'h',
  CSS3: 'c',
  JavaScript: 'j',
  React: 'r',
  Bootstrap: 'b',
  'Node.js': 'n',
  'Express.js': 'e',
  'REST APIs': 'a',
  EJS: 't', // templates
  MongoDB: 'm',
  MySQL: 'y',
  SQL: 's',
  'C++': '=', // the "+" key
  Git: 'g',
  GitHub: 'o', // octocat
  'VS Code': 'v',
  Postman: 'p',
  Figma: 'f',
  npm: 'i', // npm i
};
const SPARE = 'kldquwxzq'.split('');

function buildSkills(): BoundSkill[] {
  const byName = new Map<string, BoundSkill>();
  for (const d of skillsData) {
    for (const s of d.skills) {
      let entry = byName.get(s.name);
      if (!entry) {
        entry = { key: '', name: s.name, domains: [], tags: [] };
        byName.set(s.name, entry);
      }
      if (!entry.domains.some((x) => x.name === d.name)) entry.domains.push({ name: d.name, tag: d.tag });
      for (const t of s.tags ?? []) if (!entry.tags.includes(t)) entry.tags.push(t);
    }
  }
  const list = [...byName.values()];
  const used = new Set<string>();
  for (const s of list) {
    const k = PREFERRED[s.name];
    if (k && !used.has(k)) {
      s.key = k;
      used.add(k);
    }
  }
  for (const s of list) {
    if (s.key) continue;
    const k = SPARE.find((x) => !used.has(x));
    if (k) {
      s.key = k;
      used.add(k);
    }
  }
  return list.filter((s) => s.key);
}

const SKILLS = buildSkills();
const BY_KEY = new Map(SKILLS.map((s) => [s.key, s]));
const LEGENDS: Record<string, KeyLegend> = Object.fromEntries(
  SKILLS.map((s) => [s.key, { caption: s.name, ariaLabel: `${s.name}, key ${keyLabel(s.key)}` }]),
);
const DEFAULT_KEY = BY_KEY.has('r') ? 'r' : (SKILLS[0]?.key ?? null);
const DEMO_TEXT = 'HELLO YASH';
const BUFFER_MAX = 22;

const pad = (n: number) => String(n).padStart(2, '0');
function keyLabel(id: string) {
  if (id === 'space') return 'Space';
  return id.length === 1 ? id.toUpperCase() : id;
}

/**
 * The working stack as a keyboard: each skill sits on a mnemonic key (R = React, N = Node.js…).
 * Type on a real keyboard while the board is in view, or click / tap a lit key. Until the
 * visitor touches it, an idle demo types "HELLO YASH" and then walks through the skills.
 */
export default function SkillsKeyboard() {
  const root = useRef<HTMLDivElement>(null);
  const kb = useRef<InteractiveKeyboardHandle>(null);

  const [active, setActive] = useState<string | null>(DEFAULT_KEY);
  const [buffer, setBuffer] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduced] = useState(prefersReducedMotion);
  const [fine] = useState(isFinePointer);

  const paletteOpen = useSite((s) => s.paletteOpen);
  const activeProject = useSite((s) => s.activeProject);
  const listen = inView && !paletteOpen && !activeProject;

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Only "live" while the board is near the middle of the viewport.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '-18% 0px -18% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const engagedRef = useRef(false);
  const onKeyPress = useCallback((id: string, _source: KeyPressSource) => {
    const first = !engagedRef.current;
    if (first) {
      engagedRef.current = true;
      setEngaged(true);
    }
    sfx.key();

    setBuffer((prev) => {
      const b = first ? '' : prev;
      if (id === 'delete') return b.slice(0, -1);
      if (id === 'space') return (b + ' ').slice(-BUFFER_MAX);
      if (id === 'return') return '';
      if (id.length === 1) return (b + id.toUpperCase()).slice(-BUFFER_MAX);
      return b;
    });

    if (BY_KEY.has(id)) {
      setActive(id);
      setNote(null);
    } else if (id.length === 1) {
      setNote(`${keyLabel(id)} isn’t bound. Try a lit key.`);
    }
  }, []);

  const onKeyHover = useCallback(() => sfx.hover(), []);

  // Idle demo: type the greeting, then walk the skills. Pauses off-screen / under the pointer,
  // stops for good once the visitor presses anything.
  const demo = useRef({ phase: 'type' as 'type' | 'cycle', i: 0, n: 0 });
  const running = inView && !engaged && !hovering && !reduced;
  useEffect(() => {
    if (!running) return;
    let t = 0;
    const step = () => {
      const d = demo.current;
      if (d.phase === 'type') {
        if (d.i === 0) setBuffer('');
        const ch = DEMO_TEXT[d.i];
        kb.current?.press(ch === ' ' ? 'space' : ch.toLowerCase(), 120);
        setBuffer((b) => b + ch);
        d.i += 1;
        if (d.i >= DEMO_TEXT.length) {
          d.phase = 'cycle';
          d.n = 0;
          d.i = Math.max(0, SKILLS.findIndex((s) => s.key === activeRef.current)) + 1;
          t = window.setTimeout(step, 1500);
          return;
        }
        t = window.setTimeout(step, ch === ' ' ? 260 : 85 + Math.random() * 120);
        return;
      }
      const s = SKILLS[d.i % SKILLS.length];
      d.i += 1;
      d.n += 1;
      if (s) {
        kb.current?.press(s.key, 180);
        setActive(s.key);
      }
      if (d.n >= SKILLS.length) {
        d.phase = 'type';
        d.i = 0;
        t = window.setTimeout(step, 2200);
        return;
      }
      t = window.setTimeout(step, 1700);
    };
    t = window.setTimeout(step, 700);
    return () => window.clearTimeout(t);
  }, [running]);

  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const el = root.current;
      riseIn(el, 'top 85%', 0.08);
      const board = el.querySelector('.ikb-board');
      const keys = el.querySelectorAll('.ikb-key');
      if (!board) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: board, start: 'top 88%', once: true } });
      tl.from(board, {
        y: 70,
        rotationX: 28,
        transformPerspective: 1600,
        transformOrigin: '50% 100%',
        opacity: 0,
        duration: 1.4,
        ease: 'expo.out',
      }).from(
        keys,
        {
          y: -14,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: { amount: 0.65, from: 'center', grid: 'auto' },
        },
        0.2,
      );
    },
    { scope: root },
  );

  const skill = active ? BY_KEY.get(active) : undefined;
  const index = skill ? SKILLS.indexOf(skill) : -1;
  const domainLine = useMemo(() => skill?.domains.map((d) => d.name).join(' · ') ?? '', [skill]);

  return (
    <div ref={root} className="gutter mx-auto mt-[clamp(56px,8vw,120px)] w-full max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 pb-5">
        <p className="label">
          <Mask>Keyboard · {pad(SKILLS.length)} bound keys</Mask>
        </p>
        <p className="label">
          <Mask>{fine ? 'Type, or click a lit key' : 'Tap a lit key'}</Mask>
        </p>
      </div>

      <InteractiveKeyboard
        ref={kb}
        legends={LEGENDS}
        active={active}
        listen={listen}
        label="Skills keyboard: each lit key is a skill"
        onKeyPress={onKeyPress}
        onKeyHover={onKeyHover}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        className="mx-auto max-w-[1320px]"
      />

      <div className="mx-auto mt-[clamp(28px,4vw,56px)] grid max-w-[1320px] gap-y-8 border-t border-line pt-6 md:grid-cols-12 md:gap-x-8">
        <div className="md:col-span-7" aria-live={engaged ? 'polite' : 'off'} aria-atomic="true">
          <div className="flex items-center gap-3">
            <span className="ab-kbd" aria-hidden>
              {active ? keyLabel(active) : '—'}
            </span>
            <span className="label tabular-nums">
              {skill ? `${pad(index + 1)} / ${pad(SKILLS.length)}` : 'No key'}
            </span>
          </div>
          <p key={active ?? 'none'} className="ab-kb-name display mt-5 text-bone">
            <span className="ab-mask">
              <span className="ab-kb-rise block">{skill?.name ?? 'Press a key'}</span>
            </span>
          </p>
          {skill && <span className="sr-only">, {domainLine}</span>}
        </div>

        <div className="md:col-span-5">
          {skill && (
            <>
              <p className="label">Domain</p>
              <ul className="mt-3 grid gap-y-2">
                {skill.domains.map((d) => (
                  <li key={d.name} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="ab-val text-bone">{d.name}</span>
                    <span className="font-mono text-[12px] tracking-[0.06em] text-mute">{d.tag}</span>
                  </li>
                ))}
              </ul>
              {!!skill.tags.length && (
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label={`${skill.name} focus`}>
                  {skill.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-full border border-line px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-mute uppercase"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="mt-8 flex items-center gap-3 border-t border-line pt-4 font-mono text-[12px] tracking-[0.06em] text-mute">
            <span aria-hidden className="text-ochre">
              &gt;
            </span>
            <span className="min-w-0 truncate text-bone">
              <span className="sr-only">Typed: </span>
              {buffer}
              <span className="ab-caret ml-0.5" aria-hidden />
            </span>
            {note && <span className="ml-auto shrink-0 text-right">{note}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
