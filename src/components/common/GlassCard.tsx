import React from 'react';
import { cn } from '../../utils/helpers';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'cyan' | 'none';
  hasCornerBrackets?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  hasCornerBrackets: _hasCornerBrackets = false,
  ...props
}) => {
  const accentStyles = {
    blue: 'hover:border-[#2563EB] hover:shadow-studio-lg',
    cyan: 'hover:border-[#0284C7] hover:shadow-studio-lg',
    none: 'hover:border-[#B0ADA5]',
  }[glowColor];

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-studio transition-all duration-300',
        accentStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
