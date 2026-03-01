import { auth } from '@/lib/auth';
import {
  getInvoiceById,
  getInvoiceItems,
  getClientById,
  updateInvoiceStatus,
  getAgenciesByOwnerId,
  createAgency,
  getAgencyById,
  getAgencyPaymentMethods,
  Invoice,
  InvoiceItem,
  Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';

// Server action to mark invoice as paid
async function markInvoiceAsPaid(invoiceId: string, agencyId: string) {
  'use server';
  await updateInvoiceStatus(invoiceId, agencyId, 'paid');
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath('/dashboard/invoices');
}

// Wrapper for form action - accepts FormData
async function handleMarkAsPaid(formData: FormData) {
  'use server';
  const invoiceId = formData.get('invoiceId') as string;
  const agencyId = formData.get('agencyId') as string;
  if (invoiceId && agencyId) {
    await markInvoiceAsPaid(invoiceId, agencyId);
  }
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
  let paymentMethods: any[] = [];

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

    // Get payment methods
    paymentMethods = await getAgencyPaymentMethods(agencyId);

    // Get invoice with multi-tenant isolation
    invoice = await getInvoiceById(id, agencyId);

    if (!invoice) {
      error = 'Invoice not found';
      return (
        <div className="p-8">
          <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded">
            {error}
          </div>
          <Link href="/dashboard/invoices" className="mt-4 text-accent-blue hover:text-accent-blue/90">
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
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!invoice || !client || !agencyId) {
    return (
      <div className="p-8">
        <p className="text-accent-red">Failed to load invoice</p>
      </div>
    );
  }

  // Fix Issue 1: Validate invoice.amount before URL construction
  const validAmount = (invoice.amount ? Number(invoice.amount) : 0).toString();
  if (isNaN(parseFloat(validAmount))) {
    console.error('Invalid invoice amount:', invoice.amount);
  }

  // Fix Issue 2: Explicit null check for agencyId (already validated above, but explicitly use it)
  if (!agencyId) {
    return <div className="p-8"><p className="text-accent-red">Not authorized</p></div>;
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + (Number(item.rate) * item.quantity);
  }, 0);

  return (
    <PageTransition>
      <div className="mb-8">
        <PageHeader
          title="Invoice Details"
          description={`Invoice for ${client.name}`}
          actions={
            <div className="flex gap-3">
            <a
              href={`/api/invoices/generate?invoiceId=${encodeURIComponent(invoice.id)}`}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
            >
              Download PDF
            </a>
            {/* Fix Issue 3: Show Pay Now for draft and sent invoices */}
            {(invoice.status === 'draft' || invoice.status === 'sent') && (
              <Link
                href={`/dashboard/invoices/${id}/pay?amount=${encodeURIComponent(validAmount)}`}
                className="px-4 py-2 bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/90 transition-colors inline-block"
              >
                Pay Now
              </Link>
            )}
            {/* Payment pending shows verification message instead of buttons */}
            {invoice.status === 'payment_pending' && (
              <div className="px-4 py-2 bg-accent-amber/10 text-accent-amber rounded-lg font-medium">
                Payment submitted for verification
              </div>
            )}
            {/* Show Mark as Paid button for unpaid invoices (except payment_pending) */}
            {invoice.status !== 'paid' && invoice.status !== 'payment_pending' && (
              <form action={handleMarkAsPaid}>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <input type="hidden" name="agencyId" value={agencyId} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
                >
                  Mark as Paid
                </button>
              </form>
            )}
          </div>
          }
        />
        <Link href="/dashboard/invoices" className="text-accent-blue hover:text-accent-blue/90 text-sm font-medium">
          ← Back to Invoices
        </Link>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <p className="text-sm text-text-secondary mb-2">Invoice ID</p>
          <p className="text-lg font-semibold text-text-primary">
            {invoice.id.substring(0, 12).toUpperCase()}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <p className="text-sm text-text-secondary mb-2">Amount</p>
          <p className="text-lg font-semibold text-text-primary">
            ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <p className="text-sm text-text-secondary mb-2">Status</p>
          <p className="text-lg font-semibold text-text-primary capitalize">
            {invoice.status}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <p className="text-sm text-text-secondary mb-2">Due Date</p>
          <p className="text-lg font-semibold text-text-primary">
            {invoice.due_date
              ? new Date(invoice.due_date).toLocaleDateString('en-IN')
              : 'Not set'}
          </p>
        </div>
      </div>

      {/* Invoice Details */}
      <ScrollReveal><div className="bg-bg-secondary border border-border-default rounded-lg p-8 mb-8">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Bill To
            </h3>
            <p className="font-semibold text-text-primary">{client.name}</p>
            <p className="text-text-secondary">{client.email}</p>
            {client.phone && <p className="text-text-secondary">{client.phone}</p>}
            {client.company_name && (
              <p className="text-text-secondary mt-2">{client.company_name}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Invoice Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Invoice ID:</span>
                <span className="text-text-primary font-medium">
                  {invoice.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Date:</span>
                <span className="text-text-primary font-medium">
                  {new Date(invoice.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Due Date:</span>
                <span className="text-text-primary font-medium">
                  {invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString('en-IN')
                    : 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div></ScrollReveal>

      {/* Line Items Table */}
      <ScrollReveal delay={0.1}><div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary border-b border-border-default">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                Description
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-bg-hover">
                <td className="px-6 py-4 text-sm text-text-primary">{item.description}</td>
                <td className="px-6 py-4 text-sm text-right text-text-primary">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-right text-text-primary">
                  ₹{(item.rate ? Number(item.rate) : 0).toLocaleString(currencyLocale)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-text-primary">
                  ₹
                  {((item.rate ? Number(item.rate) : 0) * item.quantity).toLocaleString(currencyLocale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Section */}
        <div className="border-t border-border-default bg-bg-tertiary px-6 py-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-text-secondary">Subtotal:</span>
                <span className="text-text-primary">
                  ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-border-default pt-4">
                <span className="text-text-primary">Total:</span>
                <span className="text-text-primary">
                  ₹{(totalAmount || 0).toLocaleString(currencyLocale)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div></ScrollReveal>

      {/* Payment Status */}
      <ScrollReveal delay={0.15}><div className="mt-8 bg-bg-secondary border border-border-default rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                invoice.status === 'paid'
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'bg-accent-blue/10 text-accent-blue'
              }`}
            >
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
          {invoice.paid_date && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Paid Date:</span>
              <span className="text-text-primary">
                {new Date(invoice.paid_date).toLocaleDateString('en-IN')}
              </span>
            </div>
          )}
        </div>
      </div></ScrollReveal>

      {/* Payment Methods Section */}
      <ScrollReveal delay={0.2}><div className="mt-8 bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-6">
        <h2 className="text-lg font-bold text-accent-blue mb-4">Available Payment Methods</h2>

        {paymentMethods && paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center justify-between pb-3 border-b last:border-b-0">
                <span className="font-medium text-text-secondary">
                  {method.provider_id.charAt(0).toUpperCase() + method.provider_id.slice(1).replace('_', ' ')}
                </span>
                <Link
                  href={`/dashboard/invoices/${id}/pay?method=${method.provider_id}`}
                  className="px-4 py-2 bg-accent-blue text-white rounded hover:bg-accent-blue/90 text-sm"
                >
                  Pay Now
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary">
            No payment methods configured.
            <Link href="/dashboard/settings/payments" className="text-accent-blue hover:underline ml-2">
              Configure payment methods
            </Link>
          </p>
        )}
      </div></ScrollReveal>
    </PageTransition>
  );
}
