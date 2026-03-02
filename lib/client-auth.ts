import { SignJWT, jwtVerify } from 'jose';
import { NextResponse, NextRequest } from 'next/server';

/**
 * Client session payload structure
 */
export interface ClientSessionPayload {
  clientId: string;
  agencyId: string;
  email: string;
  name: string;
}

/**
 * Get the JOSE-compatible secret from NEXTAUTH_SECRET
 */
function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT session for a client and set it as an HttpOnly cookie
 *
 * @param client - Client data to store in session
 * @param response - Next.js response object to set cookie on
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * const response = NextResponse.json({ success: true });
 * await createClientSession(
 *   { id: '123', agencyId: '456', email: 'client@example.com', name: 'John' },
 *   response
 * );
 * return response;
 * ```
 */
export async function createClientSession(
  client: { id: string; agencyId: string; email: string; name: string },
  response: NextResponse
): Promise<void> {
  const secret = getSecret();

  // 30 days in seconds
  const expiresIn = 30 * 24 * 60 * 60;

  // Create JWT with 30 day expiration
  const token = await new SignJWT({
    clientId: client.id,
    agencyId: client.agencyId,
    email: client.email,
    name: client.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  // Set HttpOnly, Secure, SameSite cookie
  response.cookies.set('client-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn,
    path: '/',
  });
}

/**
 * Read and verify a client session from the request cookies
 *
 * @param request - Next.js request object with cookies
 * @returns Promise<ClientSessionPayload | null> - Session data if valid, null otherwise
 *
 * @example
 * ```ts
 * const session = await getClientSession(request);
 * if (!session) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * console.log(session.clientId);
 * ```
 */
export async function getClientSession(
  request: NextRequest
): Promise<ClientSessionPayload | null> {
  try {
    const token = request.cookies.get('client-session')?.value;

    if (!token) {
      return null;
    }

    const secret = getSecret();
    const verified = await jwtVerify(token, secret);

    // Extract payload and ensure it has the expected structure
    const payload = verified.payload as Record<string, unknown>;

    return {
      clientId: payload.clientId as string,
      agencyId: payload.agencyId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    // Cookie doesn't exist, is invalid, or signature verification failed
    return null;
  }
}

/**
 * Clear the client session cookie from the response
 *
 * @param response - Next.js response object to delete cookie from
 * @returns void
 *
 * @example
 * ```ts
 * const response = NextResponse.json({ success: true });
 * clearClientSession(response);
 * return response;
 * ```
 */
export function clearClientSession(response: NextResponse): void {
  response.cookies.set('client-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
