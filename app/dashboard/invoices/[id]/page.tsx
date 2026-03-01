import { auth } from '@/lib/auth';
import {
  getInvoiceById,
  getInvoiceItems,
  getClientById,
  updateInvoiceStatus,
  getAgenciesByOwnerId,
  createAgency,
  getAgencyById,
  Invoice,
  InvoiceItem,
  Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Server action to mark invoice as paid
async function markInvoiceAsPaid(invoiceId: string, agencyId: string) {
  'use server';
  await updateInvoiceStatus(invoiceId, agencyId, 'paid');
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath('/dashboard/invoices');
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  let invoice: Invoice | null = null;
  let client: Client | null = null;
  let items: InvoiceItem[] = [];
  let agencyId: string | null = null;
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

    if (!agencyId) {
      throw new Error('Agency not found');
    }

    // Get agency details for currency setting
    const agency = await getAgencyById(agencyId);
    if (agency?.currency === 'NPR') {
      currencyLocale = 'ne-NP';
    }

    // Get invoice with multi-tenant isolation
    invoice = await getInvoiceById(id, agencyId);

    if (!invoice) {
      error = 'Invoice not found';
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link href="/dashboard/invoices" className="mt-4 text-blue-600 hover:text-blue-700">
            Back to Invoices
          </Link>
        </div>
      );
    }

    // Validate invoice ID before using it
    if (!invoice.id) {
      throw new Error('Invalid invoice');
    }

    // Get client details
    client = await getClientById(invoice.client_id, agencyId);

    // Get invoice items
    items = await getInvoiceItems(id, agencyId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load invoice details';
  }

  if (error && !invoice) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!invoice || !client || !agencyId) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load invoice</p>
      </div>
    );
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + (Number(item.rate) * item.quantity);
  }, 0);

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link href="/dashboard/invoices" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
              ← Back to Invoices
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
            <p className="text-gray-600 mt-1">Invoice for {client.name}</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/api/invoices/generate?invoiceId=${encodeURIComponent(invoice.id)}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </a>
            {invoice.status !== 'paid' && invoice.status !== 'payment_pending' && (
              <Link
                href={`/dashboard/invoices/${id}/pay?amount=${invoice.amount}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
              >
                Pay Now
              </Link>
            )}
            {invoice.status !== 'paid' && (
              <form action={() => markInvoiceAsPaid(invoice.id, agencyId || '')}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Mark as Paid
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Invoice ID</p>
          <p className="text-lg font-semibold text-gray-900">
            {invoice.id.substring(0, 12).toUpperCase()}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Status</p>
          <p className="text-lg font-semibold text-gray-900 capitalize">
            {invoice.status}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Due Date</p>
          <p className="text-lg font-semibold text-gray-900">
            {invoice.due_date
              ? new Date(invoice.due_date).toLocaleDateString('en-IN')
              : 'Not set'}
          </p>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Bill To
            </h3>
            <p className="font-semibold text-gray-900">{client.name}</p>
            <p className="text-gray-600">{client.email}</p>
            {client.phone && <p className="text-gray-600">{client.phone}</p>}
            {client.company_name && (
              <p className="text-gray-600 mt-2">{client.company_name}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Invoice Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice ID:</span>
                <span className="text-gray-900 font-medium">
                  {invoice.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="text-gray-900 font-medium">
                  {invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString('en-IN')
                    : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Description
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900">
                  ₹{(item.rate ? Number(item.rate) : 0).toLocaleString(currencyLocale)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                  ₹
                  {((item.rate ? Number(item.rate) : 0) * item.quantity).toLocaleString(currencyLocale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">
                  ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-4">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">
                  ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
          {invoice.paid_date && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Paid Date:</span>
              <span className="text-gray-900">
                {new Date(invoice.paid_date).toLocaleDateString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
