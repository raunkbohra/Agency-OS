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
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';

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
      <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6 text-center">
        <p className="text-text-secondary">Client not found</p>
      </div>
    );
  }

  return (
    <PageTransition className="space-y-8">
      {/* Client Details */}
      <div>
        <PageHeader
          title={client.name}
          description="Client Details"
          actions={
            <Link
              href="/dashboard/clients"
              className="text-accent-blue hover:text-accent-blue/90 font-medium"
            >
              Back to Clients
            </Link>
          }
        />

        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-2">Email</h3>
              <p className="text-text-primary">{client.email}</p>
            </div>
            {client.company_name && (
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Company</h3>
                <p className="text-text-primary">{client.company_name}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Phone</h3>
                <p className="text-text-primary">{client.phone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Details */}
      {plan && clientPlan && (
        <ScrollReveal><div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Current Plan</h2>

          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Plan Name</h3>
                <p className="text-lg font-semibold text-text-primary">{plan.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Monthly Price</h3>
                <p className="text-lg font-semibold text-text-primary">
                  NPR {Number(plan.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Status</h3>
                <p className="text-lg font-semibold text-accent-green capitalize">
                  {clientPlan.status}
                </p>
              </div>
            </div>

            {plan.description && (
              <div>
                <h3 className="text-sm font-medium text-text-tertiary mb-2">Description</h3>
                <p className="text-text-secondary">{plan.description}</p>
              </div>
            )}
          </div>

          {/* Plan Deliverables */}
          {planItems.length > 0 && (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Deliverables</h3>
              <ul className="space-y-3">
                {planItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start border-l-2 border-accent-blue pl-4 py-2"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {item.deliverable_type}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {item.qty} per {item.recurrence}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollReveal>)}

      {/* Invoices */}
      <ScrollReveal delay={0.1}><div>
        <h2 className="text-2xl font-bold text-text-primary mb-6">Invoices</h2>

        {invoices.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 text-center">
            <p className="text-text-tertiary">No invoices yet</p>
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Invoice ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-bg-hover">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {invoice.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      NPR {Number(invoice.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-accent-green/10 text-accent-green'
                          : invoice.status === 'sent'
                          ? 'bg-accent-blue/10 text-accent-blue'
                          : 'bg-bg-hover text-text-primary'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
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
      </div></ScrollReveal>
    </PageTransition>
  );
}
