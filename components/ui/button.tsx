'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm',
        secondary:
          'border border-border-default bg-transparent text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover',
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        danger:
          'text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20',
        link:
          'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 text-sm gap-2',
        lg: 'h-10 px-5 text-sm gap-2',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, success, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    React.useEffect(() => {
      if (success) {
        const timer = setTimeout(() => {
          // Parent component should handle clearing success state
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [success]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading || success}
        {...props}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </motion.span>
          ) : success ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="h-4 w-4 text-green-500" />
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
