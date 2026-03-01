import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your agency from one place
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Monthly Revenue</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900">$0</div>
            <div className="text-sm text-gray-600">MRR</div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            From active clients
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Clients</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">clients</div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Active contracts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Deliverables</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">pending</div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This month
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/plans/new"
            className="block p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-blue-900">Create Plan</div>
            <p className="mt-1 text-sm text-blue-700">
              Set up a new service plan
            </p>
          </Link>

          <Link
            href="/dashboard/clients"
            className="block p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-green-900">Add Client</div>
            <p className="mt-1 text-sm text-green-700">
              Onboard a new client
            </p>
          </Link>

          <Link
            href="/dashboard/invoices"
            className="block p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium text-purple-900">View Invoices</div>
            <p className="mt-1 text-sm text-purple-700">
              Check invoice status
            </p>
          </Link>
        </div>
      </div>

      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Plans</h2>
          <Link
            href="/dashboard/plans"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No plans created yet</p>
            <Link
              href="/dashboard/plans/new"
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
