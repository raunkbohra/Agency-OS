import { auth } from '@/lib/auth';
import {
  getClientById, getClientPlansByClient, getPlanById,
  getPlanItemsByPlan, getInvoicesByClient, getContractsByClient,
  Client, ClientPlan, Plan, PlanItem, Invoice, Contract,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { StatusBadge } from '@/components/shared/status-badge';
import { ChevronLeft, Mail, Building2, Phone, Package, CheckSquare, Edit2, MapPin } from 'lucide-react';
import EmailClientButton from '@/components/EmailClientButton';
import ClientEditForm from '@/components/ClientEditForm';
import PlanEditForm from '@/components/PlanEditForm';
import ResendInviteButton from '@/components/ResendInviteButton';

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) redirect('/auth/signin');

  const agencyId = session.user.agencyId;
  const { id: clientId } = await params;

  let client: Client | null = null;
  let clientPlan: ClientPlan | null = null;
  let plan: Plan | null = null;
  let planItems: PlanItem[] = [];
  let invoices: Invoice[] = [];
  let contracts: Contract[] = [];
  let error: string | null = null;

  try {
    client = await getClientById(clientId);
    if (!client) throw new Error('Client not found');
    if (client.agency_id !== agencyId) throw new Error('Unauthorized');

    const clientPlans = await getClientPlansByClient(clientId);
    if (clientPlans.length > 0) {
      clientPlan = clientPlans[0];
      plan = await getPlanById(clientPlan.plan_id, agencyId);
      if (plan) planItems = await getPlanItemsByPlan(plan.id);
    }

    // Parallelize independent queries
    [invoices, contracts] = await Promise.all([
      getInvoicesByClient(clientId, agencyId),
      getContractsByClient(clientId, agencyId),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load client details';
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
          <ChevronLeft className="h-4 w-4" /> Clients
        </Link>
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">
          {error || 'Client not found'}
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <PageHeader
        title={client.name}
        description="Client profile"
        actions={
          <div className="flex items-center gap-2">
            <ClientEditForm client={client} agencyId={agencyId} />
            <ResendInviteButton clientId={client.id} clientName={client.name} />
            <EmailClientButton clientId={client.id} clientName={client.name} clientEmail={client.email} />
          </div>
        }
      />

      {/* Contact info */}
      <ScrollReveal>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-bg-tertiary border border-border-default flex-shrink-0 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-text-tertiary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-0.5">Email</p>
                <p className="text-sm font-medium text-text-primary break-all">{client.email}</p>
              </div>
            </div>
            {client.company_name && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-bg-tertiary border border-border-default flex-shrink-0 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Company</p>
                  <p className="text-sm font-medium text-text-primary">{client.company_name}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-bg-tertiary border border-border-default flex-shrink-0 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-text-primary">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-bg-tertiary border border-border-default flex-shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">Address</p>
                  <p className="text-sm font-medium text-text-primary whitespace-pre-line">{client.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Plan details */}
      {plan && clientPlan && (
        <ScrollReveal delay={0.05}>
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-text-secondary" />
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Current Plan</h2>
              </div>
              <PlanEditForm clientPlan={clientPlan} currentPlan={plan} clientId={client.id} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-bg-tertiary rounded-lg p-3.5 border border-border-default">
                <p className="text-xs text-text-tertiary mb-1">Plan</p>
                <p className="font-semibold text-text-primary">{plan.name}</p>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3.5 border border-border-default">
                <p className="text-xs text-text-tertiary mb-1">Price</p>
                <p className="font-semibold text-text-primary">
                  NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3.5 border border-border-default col-span-2 sm:col-span-1">
                <p className="text-xs text-text-tertiary mb-1">Status</p>
                <p className="font-semibold text-accent-green capitalize">{clientPlan.status}</p>
              </div>
            </div>

            {plan.description && (
              <p className="text-sm text-text-secondary mb-5">{plan.description}</p>
            )}

            {planItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-3.5 w-3.5 text-text-tertiary" />
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Deliverables</p>
                </div>
                <ul className="space-y-2">
                  {planItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-text-primary">{item.deliverable_type}</span>
                        <span className="text-xs text-text-tertiary ml-2">{item.qty}× per {item.recurrence}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Invoices */}
      <ScrollReveal delay={0.1}>
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-default">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Invoices</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-tertiary">No invoices yet.</div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden divide-y divide-border-default">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-bg-hover transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        NPR {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No due date'}
                      </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </Link>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Invoice ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-bg-hover transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-text-primary">{invoice.id.slice(0, 8).toUpperCase()}…</td>
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          NPR {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Contracts */}
      <ScrollReveal delay={0.15}>
        <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-default">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Contracts</h2>
          </div>

          {contracts.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-tertiary">No contracts yet.</div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden divide-y divide-border-default">
                {contracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/dashboard/contracts`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-bg-hover transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{contract.file_name}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={contract.signed ? 'signed' : 'unsigned'} />
                  </Link>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Contract</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-bg-hover transition-colors cursor-pointer">
                        <td className="px-5 py-4 text-sm font-medium text-text-primary">{contract.file_name}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={contract.signed ? 'signed' : 'unsigned'} />
                        </td>
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {new Date(contract.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </ScrollReveal>
    </PageTransition>
  );
}
