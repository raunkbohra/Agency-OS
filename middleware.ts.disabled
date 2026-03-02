import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Client session payload type
 */
interface ClientSessionPayload {
  clientId: string;
  agencyId: string;
  email: string;
  name: string;
}

/**
 * Verify a client session from the request cookie
 *
 * Since middleware runs on Edge Runtime, we can't import from lib/client-auth.ts
 * Instead, we implement JWT verification inline using the same logic.
 *
 * @param request - Next.js request object with cookies
 * @returns Promise<ClientSessionPayload | null> - Session data if valid, null otherwise
 */
async function getClientSession(
  request: NextRequest
): Promise<ClientSessionPayload | null> {
  try {
    const token = request.cookies.get('client-session')?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not set');
      return null;
    }

    const secretBytes = new TextEncoder().encode(secret);
    const verified = await jwtVerify(token, secretBytes, {
      audience: 'client-portal',
    });

    // Extract payload and ensure it has the expected structure
    const payload = verified.payload as Record<string, unknown>;

    // Validate payload has all required fields with correct types
    if (
      typeof payload.clientId !== 'string' ||
      typeof payload.agencyId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string'
    ) {
      return null; // Payload shape is invalid
    }

    return {
      clientId: payload.clientId,
      agencyId: payload.agencyId,
      email: payload.email,
      name: payload.name,
    };
  } catch (error) {
    // Cookie doesn't exist, is invalid, or signature verification failed
    return null;
  }
}

/**
 * Middleware to protect client portal routes
 *
 * Public routes (no session required):
 * - /client-portal/login
 * - /client-portal/forgot-password
 * - /client-portal/reset-password
 * - /client-portal/setup/*
 *
 * Protected routes (session required):
 * - /client-portal (dashboard)
 * - /client-portal/* (all other routes)
 *
 * Redirect logic:
 * - Unauthenticated client on protected route → redirect to /client-portal/login
 * - Authenticated client on public auth page → redirect to /client-portal
 * - Unauthenticated agency user on /client-portal/* → redirect to /auth/signin (NextAuth)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require a session
  const publicRoutes = [
    '/client-portal/login',
    '/client-portal/forgot-password',
    '/client-portal/reset-password',
  ];

  // Check if route starts with /client-portal/setup/*
  const isSetupRoute = pathname.startsWith('/client-portal/setup/');

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname) || isSetupRoute;

  // Handle all /client-portal routes
  if (pathname.startsWith('/client-portal')) {
    const clientSession = await getClientSession(request);

    if (isPublicRoute) {
      // Public route: if already authenticated, redirect to portal dashboard
      if (clientSession) {
        return NextResponse.redirect(new URL('/client-portal', request.url));
      }
      // Public route, not authenticated: allow access
      return NextResponse.next();
    }

    // Protected route: if not authenticated, redirect to login
    if (!clientSession) {
      return NextResponse.redirect(
        new URL('/client-portal/login', request.url)
      );
    }

    // Protected route, authenticated: allow access
    return NextResponse.next();
  }

  // All other routes (agency routes, etc.) pass through
  // The existing NextAuth middleware will handle them
  return NextResponse.next();
}

/**
 * Matcher config specifies which routes the middleware runs on
 * This prevents running on images, static files, etc.
 */
export const config = {
  matcher: [
    '/client-portal/:path*', // All /client-portal routes
    '/dashboard/:path*', // Keep existing NextAuth matcher (or remove if NextAuth has its own middleware)
    '/api/auth/:path*',
    // Don't run on:
    // - .next/static, .next/image, etc. (automatically skipped)
    // - /_next and public files (automatically skipped)
  ],
};
