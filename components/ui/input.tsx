import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-fast',
          'border-border-default',
          'focus:outline-none focus:border-accent-blue focus:shadow-glow-blue',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-accent-red focus:border-accent-red focus:shadow-glow-red',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
