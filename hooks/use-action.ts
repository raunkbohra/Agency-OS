'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useAction<T>(
  fn: (...args: any[]) => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const run = useCallback(
    async (...args: any[]) => {
      setState('loading');
      try {
        const result = await fn(...args);
        setState('success');
        if (options?.successMessage) {
          toast({ title: options.successMessage });
        }
        options?.onSuccess?.(result);
        setTimeout(() => setState('idle'), 1800);
        return result;
      } catch (err) {
        setState('error');
        const message =
          options?.errorMessage ??
          (err instanceof Error ? err.message : 'Something went wrong');
        toast({ title: message, variant: 'destructive' });
        options?.onError?.(err as Error);
        setTimeout(() => setState('idle'), 3000);
        throw err;
      }
    },
    [fn, options, toast]
  );

  return {
    run,
    loading: state === 'loading',
    success: state === 'success',
    error: state === 'error',
    state,
  };
}
