import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * A line mask: the inner span ([data-rise]) slides up from behind the clip.
 * Resting state is fully visible; motion.ts sets the hidden start state only when it runs.
 */
export default function Mask({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('ab-mask', className)}>
      <span data-rise className="block">
        {children}
      </span>
    </span>
  );
}
