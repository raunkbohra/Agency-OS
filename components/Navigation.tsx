import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { Session } from 'next-auth';

export default async function Navigation({ session }: { session: Session | null }) {

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/auth/signin' });
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-gray-900">Agency OS</h1>
            <div className="flex gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/plans"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Plans
              </Link>
              <Link
                href="/dashboard/clients"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Clients
              </Link>
              <Link
                href="/dashboard/invoices"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Invoices
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
