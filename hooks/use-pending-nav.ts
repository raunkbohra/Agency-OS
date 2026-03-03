'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function usePendingNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    // Clear pending when path changes
    setPendingHref(null);
  }, [pathname]);

  return { pendingHref, setPendingHref };
}
