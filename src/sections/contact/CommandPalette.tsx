import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Copy, CornerDownLeft, FileText, Hash, Search, Terminal, Volume2, VolumeX } from 'lucide-react';
import { useSite } from '../../lib/store';
import { sfx, useSound } from '../../lib/sound';
import { lockScroll, scrollToTarget } from '../../lib/smooth';
import { cn } from '../../lib/cn';
import { portfolioConfig as cfg } from '../../data/portfolioConfig';
import { projectsData } from '../../data/projectsData';
import { copyText, openExternal } from './clipboard';
import { banner, complete, PROMPT, runCommand, type TermTone } from './terminal';

/* ---------------------------------------------------------------------------------------------
   Command palette + terminal. Ctrl/⌘+K anywhere, or useSite().paletteOpen (set by the Nav).
--------------------------------------------------------------------------------------------- */

export default function CommandPalette() {
  const open = useSite((s) => s.paletteOpen);
  const setOpen = useSite((s) => s.setPaletteOpen);

  // Global shortcut lives here.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const s = useSite.getState();
        s.setPaletteOpen(!s.paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll lock + focus restore. Cleanup form so it runs before any overlay the palette opens locks.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockScroll(true);
    sfx.click();
    return () => {
      // A case study opened from (or under) the palette keeps its own lock.
      if (!useSite.getState().activeProject) lockScroll(false);
      prev?.focus({ preventScroll: true });
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return <AnimatePresence>{open && <Palette key="palette" onClose={close} />}</AnimatePresence>;
}

/* ----------------------------------------- data ----------------------------------------- */

type Mode = 'command' | 'terminal';
type Group = 'Navigate' | 'Projects' | 'Actions';
const GROUPS: Group[] = ['Navigate', 'Projects', 'Actions'];

interface Item {
  id: string;
  group: Group;
  label: string;
  hint: string;
  keywords: string;
  icon: 'hash' | 'project' | 'copy' | 'out' | 'file' | 'terminal' | 'sound-on' | 'sound-off';
  index?: string;
  run: () => void;
}

interface Line {
  id: number;
  tone: TermTone;
  text: string;
}

/** Substring match wins; otherwise ordered subsequence with bonuses for runs and word starts. */
function fuzzyScore(text: string, query: string): number | null {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const t = text.toLowerCase();
  const at = t.indexOf(q);
  if (at >= 0) return 1000 - at + (at === 0 || t[at - 1] === ' ' ? 200 : 0);
  let from = 0;
  let last = -2;
  let score = 0;
  for (const ch of q) {
    if (ch === ' ') continue;
    const f = t.indexOf(ch, from);
    if (f < 0) return null;
    score += f === last + 1 ? 6 : 1;
    if (f === 0 || t[f - 1] === ' ') score += 4;
    last = f;
    from = f + 1;
  }
  return score;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const toneClass: Record<TermTone, string> = {
  in: 'text-bone',
  out: 'text-bone/85',
  dim: 'text-mute',
  accent: 'text-ochre',
  err: 'text-[#e0715a]',
};

function ItemIcon({ icon }: { icon: Item['icon'] }) {
  const p = { size: 14, strokeWidth: 1.6, 'aria-hidden': true } as const;
  switch (icon) {
    case 'hash':
      return <Hash {...p} />;
    case 'copy':
      return <Copy {...p} />;
    case 'out':
      return <ArrowUpRight {...p} />;
    case 'file':
      return <FileText {...p} />;
    case 'terminal':
      return <Terminal {...p} />;
    case 'sound-on':
      return <Volume2 {...p} />;
    case 'sound-off':
      return <VolumeX {...p} />;
    default:
      return null;
  }
}

/* ----------------------------------------- panel ----------------------------------------- */

function Palette({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const setActiveProject = useSite((s) => s.setActiveProject);
  const soundOn = useSound((s) => s.enabled);
  const listId = useId();

  const [mode, setMode] = useState<Mode>('command');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [flash, setFlash] = useState<{ text: string; n: number } | null>(null);
  const [lines, setLines] = useState<Line[]>(() => banner().map(([tone, text], i) => ({ id: i, tone, text })));

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(100);
  const history = useRef<string[]>([]);
  const histIdx = useRef(0);

  /** Close first so Lenis is running again, then act. */
  const afterClose = useCallback(
    (fn: () => void) => {
      onClose();
      window.setTimeout(fn, 60);
    },
    [onClose],
  );

  const say = useCallback((text: string) => setFlash({ text, n: Date.now() }), []);

  const enterTerminal = useCallback((rest = '') => {
    setMode('terminal');
    setQuery(rest);
  }, []);

  const items = useMemo<Item[]>(() => {
    const nav = (id: string, label: string, keywords: string): Item => ({
      id: `nav-${id}`,
      group: 'Navigate',
      label,
      hint: `#${id}`,
      keywords,
      icon: 'hash',
      run: () =>
        afterClose(() => {
          setActiveProject(null);
          scrollToTarget(`#${id}`);
        }),
    });
    return [
      nav('home', 'Home', 'top start hero intro'),
      nav('work', 'Work', 'projects selected portfolio case studies'),
      nav('about', 'About', 'bio skills education story'),
      nav('contact', 'Contact', 'email hire talk footer'),
      ...projectsData.map(
        (p, i): Item => ({
          id: `project-${p.slug}`,
          group: 'Projects',
          label: p.title,
          hint: p.category,
          keywords: `${p.slug} ${p.technologies.join(' ')} project case study`,
          icon: 'project',
          index: String(i + 1).padStart(2, '0'),
          run: () => {
            setActiveProject(p.slug);
            onClose();
          },
        }),
      ),
      {
        id: 'copy-email',
        group: 'Actions',
        label: 'Copy email',
        hint: cfg.socials.email,
        keywords: 'mail clipboard contact address',
        icon: 'copy',
        run: () => {
          copyText(cfg.socials.email).then((ok) => say(ok ? 'Email copied to clipboard' : cfg.socials.email));
        },
      },
      {
        id: 'github',
        group: 'Actions',
        label: 'Open GitHub',
        hint: 'github ↗',
        keywords: 'code repositories source',
        icon: 'out',
        run: () => {
          openExternal(cfg.socials.github);
          onClose();
        },
      },
      {
        id: 'linkedin',
        group: 'Actions',
        label: 'Open LinkedIn',
        hint: 'linkedin ↗',
        keywords: 'profile network social',
        icon: 'out',
        run: () => {
          openExternal(cfg.socials.linkedin);
          onClose();
        },
      },
      {
        id: 'resume',
        group: 'Actions',
        label: 'Open résumé',
        hint: 'pdf ↗',
        keywords: 'resume cv pdf download',
        icon: 'file',
        run: () => {
          openExternal(cfg.resumePath);
          onClose();
        },
      },
      {
        id: 'sound',
        group: 'Actions',
        label: 'Toggle sound',
        hint: soundOn ? 'on' : 'off',
        keywords: 'audio music ambient mute unmute effects sfx volume',
        icon: soundOn ? 'sound-on' : 'sound-off',
        run: () => {
          const next = !useSound.getState().enabled;
          if (!next) sfx.click();
          useSound.getState().setEnabled(next);
          if (next) window.setTimeout(() => sfx.click(), 30);
          say(next ? 'Sound on — ambient pad + effects' : 'Sound off');
        },
      },
      {
        id: 'terminal',
        group: 'Actions',
        label: 'Open terminal',
        hint: '>',
        keywords: 'shell cli console command line',
        icon: 'terminal',
        run: () => enterTerminal(),
      },
    ];
  }, [afterClose, enterTerminal, onClose, say, setActiveProject, soundOn]);

  const groups = useMemo(() => {
    const scored = items
      .map((it) => ({ it, s: fuzzyScore(`${it.label} ${it.keywords}`, query) }))
      .filter((x): x is { it: Item; s: number } => x.s !== null);
    return GROUPS.map((g) => ({
      group: g,
      items: scored
        .filter((x) => x.it.group === g)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.it),
    })).filter((g) => g.items.length > 0);
  }, [items, query]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const indexOf = useMemo(() => new Map(flat.map((it, i) => [it.id, i])), [flat]);
  const activeIdx = flat.length ? Math.min(active, flat.length - 1) : -1;

  // Focus the input on mount and whenever the mode flips (a row click may have taken focus).
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [mode]);

  // Transient footer confirmation.
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 2200);
    return () => window.clearTimeout(id);
  }, [flash]);

  // Keep the keyboard-selected row visible.
  useEffect(() => {
    if (mode !== 'command' || activeIdx < 0) return;
    listRef.current?.querySelector(`[data-index="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, mode]);

  // Terminal auto-scroll.
  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, mode]);

  const push = (out: Array<[TermTone, string]>) =>
    setLines((ls) => [...ls, ...out.map(([tone, text]) => ({ id: nextId.current++, tone, text }))]);

  const exec = (raw: string) => {
    const cmd = raw.trim();
    if (cmd) history.current.push(cmd);
    histIdx.current = history.current.length;
    setQuery('');
    const res = runCommand(cmd);
    if (res.effect?.type === 'clear') {
      setLines([]);
      return;
    }
    push([['in', cmd], ...res.lines]);
    switch (res.effect?.type) {
      case 'exit':
        setMode('command');
        setActive(0);
        break;
      case 'project': {
        const slug = res.effect.slug;
        window.setTimeout(() => {
          setActiveProject(slug);
          onClose();
        }, 380);
        break;
      }
      case 'url':
        openExternal(res.effect.href);
        break;
      case 'mailto':
        window.location.href = res.effect.href;
        break;
      case 'sound':
        useSound.getState().setEnabled(res.effect.on);
        break;
    }
  };

  const onChange = (value: string) => {
    if (mode === 'command' && value.startsWith('>')) {
      enterTerminal(value.slice(1).trimStart());
      return;
    }
    setQuery(value);
    if (mode === 'command') setActive(0);
  };

  const trapTab = (e: KeyboardEvent) => {
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"]), a[href]');
    if (!nodes?.length) return;
    const list = Array.from(nodes);
    const i = list.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : i >= list.length - 1 ? 0 : i + 1;
    list[next].focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    const inInput = e.target === inputRef.current;
    if (inInput && !e.repeat && !e.metaKey && !e.ctrlKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter')) {
      if (mode === 'terminal') sfx.key();
    }

    if (mode === 'command') {
      if (e.key === 'Tab') return trapTab(e);
      if (!inInput || !flat.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const d = e.key === 'ArrowDown' ? 1 : -1;
        sfx.hover();
        setActive((activeIdx + d + flat.length) % flat.length);
      } else if (e.key === 'Home' && !query) {
        e.preventDefault();
        setActive(0);
      } else if (e.key === 'End' && !query) {
        e.preventDefault();
        setActive(flat.length - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flat[activeIdx]?.run();
      }
      return;
    }

    // terminal
    if (!inInput) {
      if (e.key === 'Tab') trapTab(e);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      exec(query);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const done = complete(query);
      if (done) setQuery(done);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      const next = Math.max(0, Math.min(h.length, histIdx.current + (e.key === 'ArrowUp' ? -1 : 1)));
      histIdx.current = next;
      setQuery(h[next] ?? '');
    } else if (e.key === 'Backspace' && !query) {
      e.preventDefault();
      setMode('command');
      setActive(0);
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const terminal = mode === 'terminal';
  const t = reduce ? { duration: 0.15 } : { duration: 0.42, ease: EASE };

  return (
    <div className="fixed inset-0 z-[90]">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-ink/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0.12 : 0.3 }}
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center px-4 pt-[max(10vh,72px)] sm:pt-[14vh]">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={terminal ? 'Terminal' : 'Command palette'}
          onKeyDown={onKeyDown}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
          transition={t}
          className="pointer-events-auto flex w-full max-w-[680px] origin-top flex-col overflow-hidden rounded-[4px] border border-line bg-ink-2 text-bone"
        >
          {/* Input row: same element in both modes (CSS order moves it to the bottom for the terminal) */}
          <div
            className={cn(
              'flex items-center gap-3 px-4 sm:px-5',
              terminal ? 'order-2 border-t border-line py-3 font-mono text-[13px]' : 'order-0 border-b border-line py-4',
            )}
          >
            {terminal ? (
              <span className="shrink-0 text-ochre select-none" aria-hidden>
                <span className="hidden sm:inline">{PROMPT}</span>
                <span className="sm:hidden">~$</span>
              </span>
            ) : (
              <Search size={16} strokeWidth={1.6} className="shrink-0 text-mute" aria-hidden />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder={terminal ? 'type help' : 'Search, jump, or type > for the terminal'}
              aria-label={terminal ? 'Terminal command' : 'Search commands'}
              role={terminal ? undefined : 'combobox'}
              aria-expanded={terminal ? undefined : true}
              aria-controls={terminal ? undefined : listId}
              aria-autocomplete={terminal ? undefined : 'list'}
              aria-activedescendant={!terminal && activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                'min-w-0 flex-1 bg-transparent text-bone caret-ochre outline-none placeholder:text-mute/70 focus-visible:outline-none',
                terminal ? 'font-mono text-[13px]' : 'text-[17px] tracking-[-0.01em]',
              )}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              data-cursor="link"
              className="label shrink-0 rounded-[3px] border border-line px-1.5 py-0.5 text-[10px] transition-colors hover:border-mute hover:text-bone"
            >
              esc
            </button>
          </div>

          {terminal ? (
            <div
              ref={outRef}
              data-lenis-prevent
              aria-live="polite"
              onClick={() => inputRef.current?.focus()}
              className="order-1 h-[min(380px,52vh)] overflow-y-auto overscroll-contain px-4 py-4 font-mono text-[12.5px] leading-[1.7] sm:px-5"
            >
              {lines.map((l) =>
                l.tone === 'in' ? (
                  <div key={l.id} className="mt-2 break-words whitespace-pre-wrap text-bone first:mt-0">
                    <span className="text-ochre select-none">{PROMPT} </span>
                    {l.text}
                  </div>
                ) : (
                  <div key={l.id} className={cn('min-h-[1.7em] break-words whitespace-pre-wrap', toneClass[l.tone])}>
                    {l.text}
                  </div>
                ),
              )}
            </div>
          ) : (
            <motion.div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Commands"
              data-lenis-prevent
              layoutScroll
              className="relative order-1 max-h-[min(420px,56vh)] overflow-y-auto overscroll-contain py-2"
            >
              {flat.length === 0 && (
                <p className="px-5 py-10 text-center text-[15px] text-mute">
                  Nothing matches “{query}”. Try <span className="font-mono text-bone">&gt;</span> for the terminal.
                </p>
              )}
              {groups.map(({ group, items: groupItems }) => (
                <div key={group} role="presentation" className="pb-1">
                  <div role="presentation" className="label px-4 pt-3 pb-2 sm:px-5">
                    {group}
                  </div>
                  {groupItems.map((it) => {
                    const i = indexOf.get(it.id) ?? -1;
                    const isActive = i === activeIdx;
                    return (
                      <div
                        key={it.id}
                        id={`${listId}-${i}`}
                        role="option"
                        aria-selected={isActive}
                        data-index={i}
                        data-cursor="link"
                        onPointerMove={() => {
                          if (i === activeIdx) return;
                          sfx.hover();
                          setActive(i);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => it.run()}
                        className="relative flex cursor-pointer items-center gap-3 px-4 py-2.5 select-none sm:px-5"
                      >
                        {isActive && (
                          <motion.span
                            layoutId="cmdk-active"
                            aria-hidden
                            className="absolute inset-0 bg-ink-3"
                            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 }}
                          >
                            <span className="absolute inset-y-0 left-0 w-[2px] bg-ochre" />
                          </motion.span>
                        )}
                        <span
                          className={cn(
                            'relative flex w-5 shrink-0 justify-center font-mono text-[11px] transition-colors',
                            isActive ? 'text-ochre' : 'text-mute',
                          )}
                        >
                          {it.index ?? <ItemIcon icon={it.icon} />}
                        </span>
                        <span
                          className={cn(
                            'relative min-w-0 flex-1 truncate text-[15px] transition-colors',
                            isActive ? 'text-bone' : 'text-bone/75',
                          )}
                        >
                          {it.label}
                        </span>
                        <span className="label relative hidden max-w-[45%] truncate normal-case sm:block">{it.hint}</span>
                        <CornerDownLeft
                          size={13}
                          strokeWidth={1.6}
                          aria-hidden
                          className={cn('relative shrink-0 transition-opacity', isActive ? 'text-ochre opacity-100' : 'opacity-0')}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}

          {/* Footer: hints, or a transient confirmation */}
          <div className="order-3 flex min-h-[40px] items-center justify-between gap-4 border-t border-line px-4 py-2.5 sm:px-5">
            <AnimatePresence mode="wait" initial={false}>
              {flash ? (
                <motion.span
                  key="flash"
                  role="status"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="label flex items-center gap-2 text-bone"
                >
                  <span className="size-1.5 rounded-full bg-ochre" aria-hidden />
                  {flash.text}
                </motion.span>
              ) : (
                <motion.span
                  key={mode}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="label flex flex-wrap items-center gap-x-4 gap-y-1"
                >
                  {terminal ? (
                    <>
                      <Hint k="↵">run</Hint>
                      <Hint k="↑↓">history</Hint>
                      <Hint k="tab" className="hidden sm:inline-flex">
                        complete
                      </Hint>
                      <Hint k="⌫">back</Hint>
                    </>
                  ) : (
                    <>
                      <Hint k="↑↓">select</Hint>
                      <Hint k="↵">run</Hint>
                      <Hint k=">" className="hidden sm:inline-flex">
                        terminal
                      </Hint>
                    </>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="label hidden shrink-0 sm:block">{terminal ? 'hogade.sh' : `${cfg.name} · ${cfg.systemVersion}`}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Hint({ k, children, className }: { k: string; children: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <kbd className="rounded-[3px] border border-line px-1 py-px font-mono text-[10px] leading-none text-bone/80">{k}</kbd>
      {children}
    </span>
  );
}
