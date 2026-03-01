import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getPool } from './db';
import { createHash } from 'crypto';

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
          return {
            id: generateIdFromEmail(email),
            email: email,
            name: email.split('@')[0],
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
