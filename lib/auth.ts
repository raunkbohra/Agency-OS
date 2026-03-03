import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getPool } from './db';
import { createHash } from 'crypto';
import { verifyPassword } from './password';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      agencyId: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    agencyId: string;
  }
}

// Generate a deterministic UUID-like string from email
function generateIdFromEmail(email: string): string {
  const hash = createHash('sha256').update(email).digest('hex');
  // Format as UUID v5-like string
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const userId = generateIdFromEmail(email);

        try {
          const pool = getPool();

          // Fetch user + agency (owner or member)
          const result = await pool.query(
            `SELECT u.id, u.name, u.password_hash, u.agency_id
             FROM users u
             WHERE u.email = $1
             LIMIT 1`,
            [email]
          );

          const user = result.rows[0];
          if (!user) return null;

          // Verify password if hash exists
          if (user.password_hash) {
            const valid = await verifyPassword(user.password_hash, password);
            if (!valid) return null;
          }

          return {
            id: userId,
            email,
            name: user.name ?? email.split('@')[0],
            agencyId: user.agency_id,
          };
        } catch {
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.agencyId = user.agencyId;
      }
      // Handle Google sign-in: find or auto-provision user + agency
      if (account?.provider === 'google' && token.email) {
        const userId = generateIdFromEmail(token.email as string);
        token.id = userId;
        try {
          const pool = getPool();

          // Check if agency already exists
          const existing = await pool.query(
            'SELECT id FROM agencies WHERE owner_id = $1 LIMIT 1',
            [userId]
          );

          if (existing.rows[0]) {
            token.agencyId = existing.rows[0].id;
          } else {
            // First Google sign-in — auto-provision user + agency
            const name = (token.name as string) ?? (token.email as string).split('@')[0];
            const agencyName = `${name}'s Agency`;

            const agencyResult = await pool.query(
              'INSERT INTO agencies (name, owner_id, currency) VALUES ($1, $2, $3) RETURNING id',
              [agencyName, userId, 'USD']
            );
            const agencyId = agencyResult.rows[0].id;

            await pool.query(
              'INSERT INTO users (id, agency_id, email, name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
              [userId, agencyId, token.email, name, 'owner']
            );

            token.agencyId = agencyId;
          }
        } catch (err) {
          console.error('Google sign-in provisioning error:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.agencyId = token.agencyId as string;
      }
      return session;
    },
  },
});
