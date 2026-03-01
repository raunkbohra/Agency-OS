import { auth } from '@/lib/auth';
import {
  getClientsWithPlans,
  getAgenciesByOwnerId,
  createAgency,
  Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let agencyId: string | null = null;
  let clients: (Client & { planName?: string })[] = [];
  let error: string | null = null;

  try {
    // Get user's agencies
    const agencies = await getAgenciesByOwnerId(session.user.id);

    // If no agencies exist, create a default one
    if (agencies.length === 0) {
      const newAgency = await createAgency(
        `Agency for ${session.user.email}`,
        session.user.id
      );
      agencyId = newAgency.id;
    } else {
      agencyId = agencies[0].id;
    }

    // Now get clients for this agency with their plan information
    if (agencyId) {
      clients = await getClientsWithPlans(agencyId);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load clients';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your clients and their plans</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Add Client
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No clients yet. Add your first client to get started.</p>
          <Link
            href="/dashboard/clients/new"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Add First Client
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Plan
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {client.company_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {client.planName}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-3">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
