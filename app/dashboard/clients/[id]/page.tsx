import { auth } from '@/lib/auth';
import {
  getClientById,
  getClientPlansByClient,
  getPlanById,
  getPlanItemsByPlan,
  getInvoicesByClient,
  Client,
  ClientPlan,
  Plan,
  PlanItem,
  Invoice,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id || !session.user.agencyId) {
    redirect('/auth/signin');
  }

  const agencyId = session.user.agencyId;
  const { id: clientId } = await params;

  let client: Client | null = null;
  let clientPlan: ClientPlan | null = null;
  let plan: Plan | null = null;
  let planItems: PlanItem[] = [];
  let invoices: Invoice[] = [];
  let error: string | null = null;

  try {
    // Get client
    client = await getClientById(clientId);

    if (!client) {
      throw new Error('Client not found');
    }

    // Verify client belongs to this agency
    if (client.agency_id !== agencyId) {
      throw new Error('Unauthorized');
    }

    // Get client's plan
    const clientPlans = await getClientPlansByClient(clientId);
    if (clientPlans.length > 0) {
      clientPlan = clientPlans[0];
      plan = await getPlanById(clientPlan.plan_id, agencyId);

      // Get plan items
      if (plan) {
        planItems = await getPlanItemsByPlan(plan.id);
      }
    }

    // Get client's invoices
    invoices = await getInvoicesByClient(clientId, agencyId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load client details';
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Client not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Client Details */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">Client Details</p>
          </div>
          <Link
            href="/dashboard/clients"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Clients
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
              <p className="text-gray-900">{client.email}</p>
            </div>
            {client.company_name && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Company</h3>
                <p className="text-gray-900">{client.company_name}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                <p className="text-gray-900">{client.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Details */}
      {plan && clientPlan && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Plan</h2>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Plan Name</h3>
                <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Price</h3>
                <p className="text-lg font-semibold text-gray-900">
                  NPR {Number(plan.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                <p className="text-lg font-semibold text-green-600 capitalize">
                  {clientPlan.status}
                </p>
              </div>
            </div>

            {plan.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-700">{plan.description}</p>
              </div>
            )}
          </div>

          {/* Plan Deliverables */}
          {planItems.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h3>
              <ul className="space-y-3">
                {planItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start border-l-2 border-blue-500 pl-4 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.deliverable_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.qty} per {item.recurrence}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoices</h2>

        {invoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Invoice ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {invoice.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      NPR {Number(invoice.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
