import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { Session } from 'next-auth';

export default async function Navigation({ session }: { session: Session | null }) {

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/signin' });
  }

  return (
    <nav className="bg-bg-secondary border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-text-primary">Agency OS</h1>
            <div className="flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-text-secondary hover:text-text-primary font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/plans"
                className="text-sm text-text-secondary hover:text-text-primary font-medium"
              >
                Plans
              </Link>
              <Link
                href="/dashboard/clients"
                className="text-sm text-text-secondary hover:text-text-primary font-medium"
              >
                Clients
              </Link>
              <Link
                href="/dashboard/invoices"
                className="text-sm text-text-secondary hover:text-text-primary font-medium"
              >
                Invoices
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">{session?.user?.email}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
