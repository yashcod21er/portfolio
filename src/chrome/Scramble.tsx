import type { AnchorHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { useScramble } from './useScramble';

interface ScrambleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  text: string;
}

/** Anchor whose label scrambles on hover/focus. Screen readers get the plain label. */
export function ScrambleLink({ text, className, onMouseEnter, onFocus, children, ...rest }: ScrambleLinkProps) {
  const { ref, run } = useScramble<HTMLSpanElement>(text);
  return (
    <a
      {...rest}
      aria-label={rest['aria-label'] ?? text}
      className={cn('inline-flex items-center gap-1.5', className)}
      onMouseEnter={(e) => {
        run();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        run();
        onFocus?.(e);
      }}
    >
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
      {children}
    </a>
  );
}
