// Source: Vengeance UI — flip-text, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
//
// Adapted for Yash Hogade's portfolio: "use client" dropped; renders as an inline <span> so it
// can sit inside labels/paragraphs; the keyframes ship with the component (React 19 <style>
// dedupe); each glyph flips once early in the cycle and then rests, so a loop reads as a
// periodic ripple rather than constant motion; `trigger="hover"` plays it while the nearest
// `.flip-text-scope` ancestor (or the text itself) is hovered / keyboard-focused; the visual
// glyphs are aria-hidden with an sr-only copy; reduced motion shows static text.

import { useMemo, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

// In Tailwind's components layer so utilities still win over it.
// This <style> can land before index.css, so restate Tailwind's layer order first —
// otherwise "components" is created before "base" and the preflight reset beats it.
const styles = `
@layer theme, base, components, utilities;
@layer components {
.flip-char {
  animation-name: vengeance-flip;
  animation-duration: var(--flip-duration);
  animation-delay: var(--flip-delay);
  animation-iteration-count: var(--flip-iteration);
  animation-timing-function: cubic-bezier(0.76, 0, 0.24, 1);
  animation-fill-mode: both;
  backface-visibility: hidden;
}
.flip-text--hover .flip-char { animation-name: none; }
.flip-text-scope:hover .flip-text--hover .flip-char,
.flip-text-scope:focus-visible .flip-text--hover .flip-char,
.flip-text--hover:hover .flip-char { animation-name: vengeance-flip; }
@keyframes vengeance-flip {
  0% { transform: rotateX(0deg); }
  28%, 100% { transform: rotateX(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .flip-char { animation: none !important; }
}
}
`;

interface FlipTextProps {
  className?: string;
  /** The text content to animate (split by `separator`) */
  children: string;
  /** Duration of one cycle in seconds (each glyph flips in the first ~28%) @default 2.2 */
  duration?: number;
  /** Initial delay in seconds @default 0 */
  delay?: number;
  /** Loop forever @default true */
  loop?: boolean;
  /** @default " " */
  separator?: string;
  /** All characters flip together (no stagger) @default false */
  together?: boolean;
  /** "auto" plays on mount; "hover" plays while hovered / focused @default "auto" */
  trigger?: 'auto' | 'hover';
}

export function FlipText({
  className,
  children,
  duration = 2.2,
  delay = 0,
  loop = true,
  separator = ' ',
  together = false,
  trigger = 'auto',
}: FlipTextProps) {
  const words = useMemo(() => children.split(separator), [children, separator]);
  const totalChars = children.length;

  // global character index for each (word, char)
  const starts = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const w of words) {
      out.push(acc);
      acc += w.length + separator.length;
    }
    return out;
  }, [words, separator]);

  return (
    <span className={cn('flip-text-wrapper inline-block', trigger === 'hover' && 'flip-text--hover', className)}>
      <style href="vengeance-flip-text" precedence="default">
        {styles}
      </style>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="inline-block" style={{ perspective: '1000px' }}>
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap" style={{ transformStyle: 'preserve-3d' }}>
            {Array.from(word).map((char, charIndex) => {
              const i = starts[wordIndex] + charIndex;
              const d = together ? delay : Math.sin((i / Math.max(1, totalChars)) * (Math.PI / 2)) * (duration * 0.25) + delay;
              return (
                <span
                  key={charIndex}
                  className="flip-char relative inline-block"
                  style={
                    {
                      '--flip-duration': `${duration}s`,
                      '--flip-delay': `${d}s`,
                      '--flip-iteration': loop ? 'infinite' : '1',
                      transformStyle: 'preserve-3d',
                    } as CSSProperties
                  }
                >
                  {char}
                </span>
              );
            })}
            {wordIndex < words.length - 1 && (
              <span className="inline-block">{separator === ' ' ? ' ' : separator}</span>
            )}
          </span>
        ))}
      </span>
    </span>
  );
}

export default FlipText;
