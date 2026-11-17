// Source: Vengeance UI — interactive-keyboard, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
//
// Adapted for this portfolio:
// - compact 60% ANSI layout (no F-row / numpad / arrows) sized with container-query units, so the
//   board always fits its parent (no horizontal overflow at 375px);
// - restyled to the site tokens: ink keycaps, hairline borders, a real press depth, ochre backlight
//   on the active key, small LEDs on bound keys; Geist legends;
// - data-driven: `legends` binds keys to captions; bound keys are buttons with a roving tabindex,
//   unbound keys stay clickable but are hidden from assistive tech;
// - physical keyboard listening is gated by the host (`listen`), never steals modified shortcuts
//   (Ctrl/⌘/Alt + key), ignores editable targets, and never calls preventDefault;
// - `ref.press(id)` lets the host animate a press (idle demo). Demo content removed.

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from 'react';
import { cn } from '@/lib/utils';

/* ── Layout ─────────────────────────────────────────────────────────── */

interface KeyDef {
  id: string;
  /** printed legend */
  glyph: string;
  /** shifted legend, printed above the glyph */
  shift?: string;
  /** width in key units */
  w?: number;
  /** modifier-style legend: small, lowercase, bottom-left or bottom-right */
  mod?: 'l' | 'r';
}

const letters = (s: string): KeyDef[] => s.split('').map((c) => ({ id: c, glyph: c }));
const sym = (id: string, shift: string, w?: number): KeyDef => ({ id, glyph: id, shift, w });

const ROWS: KeyDef[][] = [
  [
    sym('`', '~'),
    ...'1234567890'.split('').map((d, i) => sym(d, '!@#$%^&*()'[i])),
    sym('-', '_'),
    sym('=', '+'),
    { id: 'delete', glyph: 'delete', w: 2, mod: 'r' },
  ],
  [
    { id: 'tab', glyph: 'tab', w: 1.5, mod: 'l' },
    ...letters('qwertyuiop'),
    sym('[', '{'),
    sym(']', '}'),
    sym('\\', '|', 1.5),
  ],
  [
    { id: 'caps lock', glyph: 'caps', w: 1.75, mod: 'l' },
    ...letters('asdfghjkl'),
    sym(';', ':'),
    sym("'", '"'),
    { id: 'return', glyph: 'return', w: 2.25, mod: 'r' },
  ],
  [
    { id: 'shift', glyph: 'shift', w: 2.25, mod: 'l' },
    ...letters('zxcvbnm'),
    sym(',', '<'),
    sym('.', '>'),
    sym('/', '?'),
    { id: 'shift', glyph: 'shift', w: 2.75, mod: 'r' },
  ],
  [
    { id: 'control', glyph: 'ctrl', w: 1.5, mod: 'l' },
    { id: 'option', glyph: 'opt', w: 1.25, mod: 'l' },
    { id: 'command', glyph: 'cmd', w: 1.5, mod: 'l' },
    { id: 'space', glyph: '', w: 6.5 },
    { id: 'command', glyph: 'cmd', w: 1.5, mod: 'r' },
    { id: 'option', glyph: 'opt', w: 1.25, mod: 'r' },
    { id: 'control', glyph: 'ctrl', w: 1.5, mod: 'r' },
  ],
];

/** Board width in key units (15) + plate padding (2 × 0.25). */
const BOARD_UNITS = 15.5;

const KEY_CODE_MAP: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  Backspace: 'delete',
  Tab: 'tab',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  CapsLock: 'caps lock',
  Semicolon: ';',
  Quote: "'",
  Enter: 'return',
  NumpadEnter: 'return',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
  Comma: ',',
  Period: '.',
  Slash: '/',
  ControlLeft: 'control',
  ControlRight: 'control',
  AltLeft: 'option',
  AltRight: 'option',
  MetaLeft: 'command',
  MetaRight: 'command',
  Space: 'space',
};
for (const c of 'abcdefghijklmnopqrstuvwxyz') KEY_CODE_MAP[`Key${c.toUpperCase()}`] = c;
for (const d of '0123456789') KEY_CODE_MAP[`Digit${d}`] = d;

const MODIFIERS = new Set(['shift', 'control', 'option', 'command', 'caps lock']);

function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
  );
}

/* ── API ────────────────────────────────────────────────────────────── */

export interface KeyLegend {
  /** short caption printed on the cap (hidden when the board is small) */
  caption: string;
  /** accessible name for the key; defaults to "<caption>, key <glyph>" */
  ariaLabel?: string;
}

export type KeyPressSource = 'key' | 'tap';

export interface InteractiveKeyboardHandle {
  /** Animate a press without firing onKeyPress (idle demos). */
  press: (id: string, ms?: number) => void;
}

export interface InteractiveKeyboardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onKeyPress'> {
  ref?: Ref<InteractiveKeyboardHandle>;
  /** keys that carry a caption; these are the "bound" keys */
  legends?: Record<string, KeyLegend>;
  /** the backlit key */
  active?: string | null;
  /** listen to the physical keyboard (the host decides when: in view, no overlay open…) */
  listen?: boolean;
  /** accessible name of the key group */
  label?: string;
  onKeyPress?: (id: string, source: KeyPressSource) => void;
  /** pointer hover on a bound key */
  onKeyHover?: (id: string) => void;
}

export function InteractiveKeyboard({
  ref,
  legends = {},
  active = null,
  listen = false,
  label = 'Keyboard',
  onKeyPress,
  onKeyHover,
  className,
  ...props
}: InteractiveKeyboardProps) {
  const [capsLock, setCapsLock] = useState(false);
  const [held, setHeld] = useState<ReadonlySet<string>>(() => new Set());
  const [ghost, setGhost] = useState<ReadonlySet<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const timers = useRef(new Set<number>());

  const onKeyPressRef = useRef(onKeyPress);
  useEffect(() => {
    onKeyPressRef.current = onKeyPress;
  }, [onKeyPress]);

  const press = useCallback((id: string, ms = 150) => {
    setGhost((prev) => new Set(prev).add(id));
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      setGhost((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, ms);
    timers.current.add(t);
  }, []);

  useImperativeHandle(ref, () => ({ press }), [press]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!listen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented || isEditableTarget(event.target)) return;
      const keyName = KEY_CODE_MAP[event.code];
      if (!keyName) return;
      const isMod = MODIFIERS.has(keyName);
      // Leave shortcuts (Ctrl/⌘+K, Alt+…) to the rest of the site.
      if (!isMod && (event.ctrlKey || event.metaKey || event.altKey)) return;
      // A focused keycap handles its own Enter / Space via click.
      if (
        (keyName === 'return' || keyName === 'space') &&
        boardRef.current?.contains(event.target as Node)
      )
        return;
      if (event.repeat) return;
      if (keyName === 'caps lock') setCapsLock(event.getModifierState('CapsLock'));
      setHeld((prev) => new Set(prev).add(keyName));
      if (!isMod) onKeyPressRef.current?.(keyName, 'key');
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const keyName = KEY_CODE_MAP[event.code];
      if (!keyName) return;
      setHeld((prev) => {
        // macOS swallows keyup events while command is held, so releasing
        // command clears everything to avoid stuck keys
        if (keyName === 'command') return prev.size ? new Set() : prev;
        if (!prev.has(keyName)) return prev;
        const next = new Set(prev);
        next.delete(keyName);
        return next;
      });
    };

    const handleBlur = () => setHeld(new Set());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      // keyups are no longer heard: release everything so nothing sticks
      setHeld((prev) => (prev.size ? new Set() : prev));
    };
  }, [listen]);

  const handleClick = (id: string, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (id === 'caps lock') setCapsLock((v) => !v);
    press(id, 160);
    onKeyPressRef.current?.(id, e.detail === 0 ? 'key' : 'tap');
  };

  // Roving tabindex across bound keys: one tab stop, arrows move between keys.
  const boundIds = ROWS.flat()
    .map((k) => k.id)
    .filter((id, i, all) => legends[id] && all.indexOf(id) === i);
  const tabStop =
    (focusId && legends[focusId] && focusId) || (active && legends[active] && active) || boundIds[0];

  const onBoardKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const id = target.dataset.key;
    if (!id || !legends[id]) return;
    const i = boundIds.indexOf(id);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % boundIds.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + boundIds.length) % boundIds.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = boundIds.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const nextId = boundIds[next];
    setFocusId(nextId);
    boardRef.current?.querySelector<HTMLButtonElement>(`[data-key="${CSS.escape(nextId)}"][data-bound]`)?.focus();
  };

  return (
    <div className={cn('ikb', className)} {...props}>
      <style>{KEYBOARD_CSS}</style>
      <div ref={boardRef} className="ikb-board" role="group" aria-label={label} onKeyDown={onBoardKeyDown}>
        {ROWS.map((row, r) => (
          <div className="ikb-row" key={r}>
            {row.map((k, i) => {
              const legend = legends[k.id];
              const bound = !!legend;
              const isActive = bound && active === k.id;
              const isPressed = held.has(k.id) || ghost.has(k.id);
              const isLetter = k.id.length === 1 && !k.shift;
              return (
                <button
                  key={`${r}-${i}`}
                  type="button"
                  className="ikb-key"
                  data-key={k.id}
                  data-bound={bound || undefined}
                  data-active={isActive || undefined}
                  data-pressed={isPressed || undefined}
                  data-kind={k.mod ? `mod-${k.mod}` : k.shift ? 'sym' : isLetter ? 'letter' : 'blank'}
                  style={{ '--w': k.w ?? 1 } as CSSProperties}
                  tabIndex={bound && k.id === tabStop ? 0 : -1}
                  aria-hidden={bound ? undefined : true}
                  aria-label={bound ? (legend.ariaLabel ?? `${legend.caption}, key ${k.glyph.toUpperCase()}`) : undefined}
                  aria-pressed={bound ? isActive : undefined}
                  onFocus={bound ? () => setFocusId(k.id) : undefined}
                  onClick={(e) => handleClick(k.id, e)}
                  onPointerEnter={
                    bound && onKeyHover ? (e) => e.pointerType === 'mouse' && onKeyHover(k.id) : undefined
                  }
                >
                  <span className="ikb-cap">
                    {k.shift && <span className="ikb-shift">{k.shift}</span>}
                    {k.glyph && <span className="ikb-glyph">{k.glyph}</span>}
                    {bound && (
                      <span
                        className="ikb-caption"
                        style={{ '--len': Math.max(legend.caption.length, 3) } as CSSProperties}
                      >
                        {legend.caption}
                      </span>
                    )}
                    {(bound || k.id === 'caps lock') && (
                      <span className="ikb-led" data-on={(k.id === 'caps lock' && capsLock) || undefined} />
                    )}
                    {(k.id === 'f' || k.id === 'j') && <span className="ikb-bump" />}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InteractiveKeyboard;

/* ── Styles (tokens from src/index.css) ─────────────────────────────── */

const KEYBOARD_CSS = `
.ikb {
  container-type: inline-size;
  width: 100%;
  -webkit-user-select: none;
  user-select: none;
}
.ikb-board {
  --u: calc((100cqi - 2px) / ${BOARD_UNITS});
  --depth: max(2px, calc(var(--u) * 0.075));
  --skirt: color-mix(in srgb, var(--color-ink-2) 40%, var(--color-ink));
  position: relative;
  display: flex;
  flex-direction: column;
  padding: calc(var(--u) * 0.25);
  border: 1px solid var(--color-line);
  border-radius: calc(var(--u) * 0.16);
  background:
    radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--color-ink-2) 85%, transparent), transparent 70%),
    var(--color-ink);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--color-bone) 6%, transparent),
    inset 0 calc(var(--u) * -0.06) calc(var(--u) * 0.2) rgb(0 0 0 / 0.45),
    0 calc(var(--u) * 0.5) calc(var(--u) * 1.2) calc(var(--u) * -0.35) rgb(0 0 0 / 0.7);
}
.ikb-row { display: flex; }

.ikb-key {
  position: relative;
  flex: none;
  width: calc(var(--u) * var(--w, 1));
  height: var(--u);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
/* light bleeding through the switch under a backlit cap */
.ikb-key::before {
  content: "";
  position: absolute;
  inset: 4% 6% 0;
  border-radius: calc(var(--u) * 0.2);
  background: radial-gradient(closest-side, color-mix(in srgb, var(--color-ochre) 55%, transparent), transparent);
  opacity: 0;
  transition: opacity 420ms var(--ease-expo);
  pointer-events: none;
}
.ikb-key[data-active]::before { opacity: 0.55; }

.ikb-cap {
  position: absolute;
  top: calc(var(--u) * 0.05);
  bottom: calc(var(--u) * 0.05 + var(--depth));
  left: calc(var(--u) * 0.045);
  right: calc(var(--u) * 0.045);
  border: 1px solid var(--color-line);
  border-radius: calc(var(--u) * 0.1);
  background: linear-gradient(180deg, var(--color-ink-3), var(--color-ink-2) 80%);
  box-shadow:
    0 var(--depth) 0 0 var(--skirt),
    0 var(--depth) 0 1px var(--color-line),
    inset 0 1px 0 color-mix(in srgb, var(--color-bone) 7%, transparent);
  color: var(--color-mute);
  transition:
    transform 140ms var(--ease-expo),
    box-shadow 140ms var(--ease-expo),
    background-color 300ms ease,
    border-color 300ms ease,
    color 300ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .ikb-key:hover .ikb-cap {
    background: linear-gradient(180deg, color-mix(in srgb, var(--color-bone) 6%, var(--color-ink-3)), var(--color-ink-2) 80%);
  }
  .ikb-key[data-bound]:hover .ikb-cap { border-color: color-mix(in srgb, var(--color-bone) 22%, var(--color-line)); }
}
.ikb-key:active .ikb-cap,
.ikb-key[data-pressed] .ikb-cap {
  transform: translateY(var(--depth));
  box-shadow:
    0 0 0 0 var(--skirt),
    0 0 0 1px color-mix(in srgb, var(--color-line) 60%, transparent),
    inset 0 2px 3px rgb(0 0 0 / 0.45);
  transition-duration: 60ms;
}
.ikb-key[data-active] .ikb-cap {
  border-color: color-mix(in srgb, var(--color-ochre) 55%, var(--color-line));
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-ochre) 9%, var(--color-ink-3)), var(--color-ink-2) 85%);
  box-shadow:
    0 var(--depth) 0 0 var(--skirt),
    0 var(--depth) 0 1px color-mix(in srgb, var(--color-ochre) 35%, var(--color-line)),
    0 calc(var(--depth) + var(--u) * 0.06) calc(var(--u) * 0.4) calc(var(--u) * -0.12) color-mix(in srgb, var(--color-ochre) 45%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-ochre) 18%, transparent);
}
.ikb-key[data-active][data-pressed] .ikb-cap,
.ikb-key[data-active]:active .ikb-cap {
  box-shadow:
    0 0 0 0 var(--skirt),
    0 0 0 1px color-mix(in srgb, var(--color-ochre) 35%, var(--color-line)),
    0 0 calc(var(--u) * 0.35) calc(var(--u) * -0.1) color-mix(in srgb, var(--color-ochre) 45%, transparent),
    inset 0 2px 3px rgb(0 0 0 / 0.4);
}
.ikb-key:focus-visible .ikb-cap {
  outline: 2px solid var(--color-ochre);
  outline-offset: 2px;
}

/* legends */
.ikb-cap > span { position: absolute; line-height: 1; white-space: nowrap; pointer-events: none; }
.ikb-glyph,
.ikb-shift {
  left: calc(var(--u) * 0.13);
  font-family: var(--font-sans);
  font-weight: 500;
}
.ikb-key[data-kind="letter"] .ikb-glyph {
  top: calc(var(--u) * 0.11);
  font-size: max(8px, calc(var(--u) * 0.25));
  text-transform: uppercase;
}
.ikb-key[data-kind="sym"] .ikb-shift {
  top: calc(var(--u) * 0.1);
  font-size: max(6px, calc(var(--u) * 0.17));
}
.ikb-key[data-kind="sym"] .ikb-glyph {
  top: calc(var(--u) * 0.3);
  font-size: max(7px, calc(var(--u) * 0.19));
}
.ikb-key[data-kind^="mod"] .ikb-glyph {
  bottom: calc(var(--u) * 0.1);
  font-family: var(--font-mono);
  font-size: max(6px, calc(var(--u) * 0.135));
  letter-spacing: 0.02em;
}
.ikb-key[data-kind="mod-r"] .ikb-glyph { left: auto; right: calc(var(--u) * 0.13); }

.ikb-key[data-bound] .ikb-cap { color: var(--color-bone); }
.ikb-key[data-bound] .ikb-shift { color: var(--color-mute); }
.ikb-key[data-active] .ikb-glyph,
.ikb-key[data-active] .ikb-caption { color: var(--color-ochre); }

.ikb-caption {
  left: calc(var(--u) * 0.13);
  right: calc(var(--u) * 0.1);
  bottom: calc(var(--u) * 0.1);
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-sans);
  font-size: max(7px, min(10.5px, calc(var(--u) * 1.12 / var(--len, 6))));
  letter-spacing: -0.005em;
  color: var(--color-mute);
  transition: color 300ms ease;
}

.ikb-led {
  top: calc(var(--u) * 0.12);
  right: calc(var(--u) * 0.12);
  width: max(3px, calc(var(--u) * 0.06));
  height: max(3px, calc(var(--u) * 0.06));
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-ochre) 45%, var(--color-ink-3));
  transition: background-color 300ms ease, box-shadow 300ms ease;
}
.ikb-key[data-kind^="mod"] .ikb-led { background: var(--color-line); }
.ikb-led[data-on],
.ikb-key[data-active] .ikb-led {
  background: var(--color-ochre);
  box-shadow: 0 0 calc(var(--u) * 0.1) color-mix(in srgb, var(--color-ochre) 70%, transparent);
}

.ikb-bump {
  left: calc(50% - var(--u) * 0.11);
  bottom: calc(var(--u) * 0.12);
  width: calc(var(--u) * 0.22);
  height: max(1px, calc(var(--u) * 0.025));
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-bone) 30%, transparent);
}

/* small boards: drop the fine print, keep letters + LEDs */
@container (max-width: 959px) {
  .ikb-caption { display: none; }
}
@container (max-width: 559px) {
  .ikb-shift { display: none; }
  .ikb-key[data-kind="sym"] .ikb-glyph { top: calc(var(--u) * 0.14); }
  .ikb-bump { display: none; }
}
`;
