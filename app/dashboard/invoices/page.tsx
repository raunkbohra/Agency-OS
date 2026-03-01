import { auth } from '@/lib/auth';
import {
  getInvoicesByAgency,
  getAgenciesByOwnerId,
  createAgency,
  getAgencyById,
  Invoice,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function InvoicesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let agencyId: string | null = null;
  let invoices: Invoice[] = [];
  let error: string | null = null;
  let currencyLocale = 'en-IN'; // default to INR

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

    // Get agency details for currency setting
    if (agencyId) {
      const agency = await getAgencyById(agencyId);
      if (agency?.currency === 'NPR') {
        currencyLocale = 'ne-NP';
      }
      invoices = await getInvoicesByAgency(agencyId);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load invoices';
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">Manage and track your invoices</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">
            No invoices yet. Create a client and assign a plan to generate an invoice.
          </p>
          <Link
            href="/dashboard/clients/new"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Add First Client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {invoice.client_name || 'Unknown Client'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{(invoice.amount ? Number(invoice.amount) : 0).toLocaleString(currencyLocale)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString('en-IN')
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      statusColors[invoice.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
