import { auth } from '@/lib/auth';
import {
  getInvoiceById, getInvoiceItems, getClientById, updateInvoiceStatus,
  getAgenciesByOwnerId, createAgency, getAgencyById, getAgencyPaymentMethods,
  Invoice, InvoiceItem, Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { StatusBadge } from '@/components/shared/status-badge';
import { ChevronLeft, Download, CreditCard } from 'lucide-react';

async function markInvoiceAsPaid(invoiceId: string, agencyId: string) {
  'use server';
  await updateInvoiceStatus(invoiceId, agencyId, 'paid');
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath('/dashboard/invoices');
}

async function handleMarkAsPaid(formData: FormData) {
  'use server';
  const invoiceId = formData.get('invoiceId') as string;
  const agencyId = formData.get('agencyId') as string;
  if (invoiceId && agencyId) await markInvoiceAsPaid(invoiceId, agencyId);
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const { id } = await params;
  let invoice: Invoice | null = null;
  let client: Client | null = null;
  let items: InvoiceItem[] = [];
  let agencyId: string | null = null;
  let error: string | null = null;
  let currencyLocale = 'en-IN';
  let paymentMethods: any[] = [];

  try {
    const agencies = await getAgenciesByOwnerId(session.user.id);
    agencyId = agencies.length === 0
      ? (await createAgency(`Agency for ${session.user.email}`, session.user.id)).id
      : agencies[0].id;

    if (!agencyId) throw new Error('Agency not found');

    const agency = await getAgencyById(agencyId);
    if (agency?.currency === 'NPR') currencyLocale = 'ne-NP';

    paymentMethods = await getAgencyPaymentMethods(agencyId);
    invoice = await getInvoiceById(id, agencyId);

    if (!invoice) {
      return (
        <div className="space-y-4">
          <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-accent-blue font-medium">
            <ChevronLeft className="h-4 w-4" /> Invoices
          </Link>
          <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">Invoice not found</div>
        </div>
      );
    }

    client = await getClientById(invoice.client_id, agencyId);
    items = await getInvoiceItems(id, agencyId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load invoice';
  }

  if (error && !invoice) {
    return (
      <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">{error}</div>
    );
  }

  if (!invoice || !client || !agencyId) {
    return <div className="text-accent-red text-sm">Failed to load invoice</div>;
  }

  const validAmount = (invoice.amount ? Number(invoice.amount) : 0).toString();
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.rate) * item.quantity), 0);

  return (
    <PageTransition>
      {/* Header + back */}
      <div className="mb-6">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium mb-4">
          <ChevronLeft className="h-4 w-4" /> Invoices
        </Link>
        <PageHeader
          title="Invoice Details"
          description={`For ${client.name}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/invoices/generate?invoiceId=${encodeURIComponent(invoice.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </a>
              {(invoice.status === 'draft' || invoice.status === 'sent') && (
                <Link
                  href={`/dashboard/invoices/${id}/pay?amount=${encodeURIComponent(validAmount)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-green text-white rounded-lg font-medium hover:bg-accent-green/90 transition-colors"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay Now
                </Link>
              )}
              {invoice.status === 'payment_pending' && (
                <div className="px-3 py-2 text-sm bg-accent-amber/10 text-accent-amber rounded-lg font-medium">
                  Verifying payment…
                </div>
              )}
              {invoice.status !== 'paid' && invoice.status !== 'payment_pending' && (
                <form action={handleMarkAsPaid}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="agencyId" value={agencyId} />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm bg-bg-secondary text-text-primary border border-border-default rounded-lg font-medium hover:bg-bg-hover transition-colors"
                  >
                    Mark Paid
                  </button>
                </form>
              )}
            </div>
          }
        />
      </div>

      {/* Summary cards: 2×2 on mobile, 4 in a row on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Invoice ID', value: invoice.id.substring(0, 8).toUpperCase() },
          { label: 'Amount', value: `₹${(totalAmount || 0).toLocaleString(currencyLocale)}` },
          { label: 'Status', value: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) },
          { label: 'Due Date', value: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'Not set' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-secondary border border-border-default rounded-xl p-4">
            <p className="text-xs text-text-tertiary mb-1.5">{label}</p>
            <p className="text-base font-bold text-text-primary leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Bill to + Invoice info: stacked on mobile, side-by-side on sm+ */}
      <ScrollReveal>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Bill To</h3>
              <p className="font-semibold text-text-primary">{client.name}</p>
              <p className="text-sm text-text-secondary mt-0.5">{client.email}</p>
              {client.phone && <p className="text-sm text-text-secondary">{client.phone}</p>}
              {client.company_name && <p className="text-sm text-text-secondary mt-1">{client.company_name}</p>}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Invoice Info</h3>
              <div className="space-y-2">
                {[
                  { key: 'Invoice ID', val: invoice.id.substring(0, 8).toUpperCase() },
                  { key: 'Date', val: new Date(invoice.created_at).toLocaleDateString('en-IN') },
                  { key: 'Due Date', val: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'Not set' },
                ].map(({ key, val }) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{key}</span>
                    <span className="text-text-primary font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Line items */}
      <ScrollReveal delay={0.1}>
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden mb-5">
          {/* Mobile: card per item */}
          <div className="sm:hidden divide-y divide-border-default">
            <div className="px-4 py-2.5 bg-bg-tertiary border-b border-border-default">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Line Items</p>
            </div>
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-text-primary flex-1">{item.description}</p>
                  <p className="text-sm font-semibold text-text-primary flex-shrink-0">
                    ₹{((item.rate ? Number(item.rate) : 0) * item.quantity).toLocaleString(currencyLocale)}
                  </p>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  {item.quantity} × ₹{(item.rate ? Number(item.rate) : 0).toLocaleString(currencyLocale)}
                </p>
              </div>
            ))}
            <div className="px-4 py-3.5 bg-bg-tertiary border-t border-border-default flex justify-between">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-sm font-bold text-text-primary">₹{(totalAmount || 0).toLocaleString(currencyLocale)}</span>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-hover">
                    <td className="px-6 py-4 text-sm text-text-primary">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-right text-text-primary">{item.quantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-text-primary">
                      ₹{(item.rate ? Number(item.rate) : 0).toLocaleString(currencyLocale)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-text-primary">
                      ₹{((item.rate ? Number(item.rate) : 0) * item.quantity).toLocaleString(currencyLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border-default bg-bg-tertiary px-6 py-4 flex justify-end">
              <div className="w-56 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">₹{(totalAmount || 0).toLocaleString(currencyLocale)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border-default pt-2">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">₹{(totalAmount || 0).toLocaleString(currencyLocale)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Payment methods */}
      <ScrollReveal delay={0.15}>
        <div className="bg-accent-blue/[0.06] border border-accent-blue/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-accent-blue" />
            <h2 className="text-sm font-bold text-accent-blue uppercase tracking-wide">Payment Methods</h2>
          </div>
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-2.5">
              {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center justify-between py-2.5 border-b border-accent-blue/10 last:border-b-0">
                  <span className="text-sm font-medium text-text-primary capitalize">
                    {method.provider_id.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/dashboard/invoices/${id}/pay?method=${method.provider_id}`}
                    className="px-3 py-1.5 bg-accent-blue text-white rounded-lg text-xs font-semibold hover:bg-accent-blue/90 transition-colors"
                  >
                    Pay Now
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No payment methods configured.{' '}
              <Link href="/dashboard/settings/payments" className="text-accent-blue hover:underline">
                Configure now
              </Link>
            </p>
          )}
        </div>
      </ScrollReveal>
    </PageTransition>
  );
}
