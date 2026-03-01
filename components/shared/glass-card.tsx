import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-glass-border bg-glass-bg backdrop-blur-xl p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
