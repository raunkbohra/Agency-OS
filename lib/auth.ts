import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { getPool } from './db';
import { createHash } from 'crypto';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      agencyId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    agencyId?: string;
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
        // TODO: Implement proper authentication logic
        // For now, accept any non-empty email/password
        if (credentials?.email && credentials?.password) {
          const email = credentials.email as string;
          const userId = generateIdFromEmail(email);

          try {
            // Try to fetch the agency for this user
            const pool = getPool();
            const result = await pool.query(
              'SELECT id FROM agencies WHERE owner_id = $1 LIMIT 1',
              [userId]
            );
            const agencyId = result.rows[0]?.id;

            return {
              id: userId,
              email: email,
              name: email.split('@')[0],
              agencyId: agencyId,
            };
          } catch (err) {
            // If database lookup fails, still allow login but without agencyId
            return {
              id: userId,
              email: email,
              name: email.split('@')[0],
            };
          }
        }
        return null;
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
      // Handle Google sign-in: populate id + agencyId from DB
      if (account?.provider === 'google' && token.email) {
        const userId = generateIdFromEmail(token.email as string);
        token.id = userId;
        try {
          const pool = getPool();
          const result = await pool.query(
            'SELECT id FROM agencies WHERE owner_id = $1 LIMIT 1',
            [userId]
          );
          token.agencyId = result.rows[0]?.id;
        } catch (err) {
          // If database lookup fails, token.agencyId remains undefined
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.agencyId = token.agencyId as string | undefined;
      }
      return session;
    },
  },
});
