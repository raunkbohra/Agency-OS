'use client';

import * as React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';

interface LoadingMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuItem> {
  onAction: () => Promise<void>;
  children: React.ReactNode;
}

export const LoadingMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  LoadingMenuItemProps
>(({ onAction, children, onSelect, ...props }, ref) => {
  const [pending, setPending] = React.useState(false);

  const handleSelect = async (e: Event) => {
    e.preventDefault();
    setPending(true);
    try {
      await onAction();
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenuItem
      ref={ref}
      onSelect={handleSelect}
      disabled={pending}
      {...props}
    >
      {pending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
      {children}
    </DropdownMenuItem>
  );
});

LoadingMenuItem.displayName = 'LoadingMenuItem';
