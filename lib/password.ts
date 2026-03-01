import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function verifyPassword(stored: string, supplied: string): Promise<boolean> {
  const [hash, salt] = stored.split('.');
  if (!hash || !salt) return false;
  const hashBuf = Buffer.from(hash, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuf, suppliedBuf);
}

// Deterministic UUID from email (must match auth.ts)
import { createHash } from 'crypto';
export function generateIdFromEmail(email: string): string {
  const hash = createHash('sha256').update(email).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

// Signed reset token: base64url(email:expiry:hmac)
const RESET_TOKEN_TTL = 60 * 60 * 1000; // 1 hour

export function createResetToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? 'fallback-secret';
  const expiry = Date.now() + RESET_TOKEN_TTL;
  const payload = `${email}:${expiry}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyResetToken(token: string): string | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET ?? 'fallback-secret';
    const decoded = Buffer.from(token, 'base64url').toString();
    const lastColon = decoded.lastIndexOf(':');
    const secondLastColon = decoded.lastIndexOf(':', lastColon - 1);
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const email = decoded.slice(0, secondLastColon);
    const expiry = parseInt(decoded.slice(secondLastColon + 1, lastColon), 10);

    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expectedSig) return null;
    if (Date.now() > expiry) return null;
    return email;
  } catch {
    return null;
  }
}
