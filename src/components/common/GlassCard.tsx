import React from 'react';
import { cn } from '../../utils/helpers';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'none';
  hasCornerBrackets?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  hasCornerBrackets = false,
  ...props
}) => {
  const glowStyles = {
    cyan: 'hover:border-[var(--accent-cyan)]/60 hover:shadow-[0_0_20px_rgba(57,223,255,0.2)]',
    violet: 'hover:border-[var(--accent-violet)]/60 hover:shadow-[0_0_20px_rgba(155,123,255,0.2)]',
    none: '',
  }[glowColor];

  return (
    <div
      className={cn(
        'relative rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-md transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none',
        hasCornerBrackets && 'corner-bracket',
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
