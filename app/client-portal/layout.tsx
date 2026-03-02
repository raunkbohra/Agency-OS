'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Client Portal Layout
 * Protects authenticated routes and redirects unauthenticated users to login
 */
export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/client-portal/login',
    '/client-portal/forgot-password',
    '/client-portal/reset-password',
  ];

  const isPublicRoute = (path: string) => {
    // Check exact matches for public routes
    if (publicRoutes.includes(path)) return true;
    // Check for setup routes: /client-portal/setup/[token]
    if (path.startsWith('/client-portal/setup/')) return true;
    return false;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user has a valid session by calling a protected API
        const res = await fetch('/api/client-portal/me/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 401) {
          // No session - redirect if on protected route
          if (!isPublicRoute(pathname)) {
            router.push('/client-portal/login');
          }
          setHasSession(false);
        } else if (res.ok) {
          // Has session - redirect if on public auth page
          if (publicRoutes.includes(pathname)) {
            router.push('/client-portal');
          }
          setHasSession(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, if on protected route, redirect to login
        if (!isPublicRoute(pathname)) {
          router.push('/client-portal/login');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname]);

  // Show loading state while checking authentication
  if (isChecking && !isPublicRoute(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-3 border-accent-blue border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
