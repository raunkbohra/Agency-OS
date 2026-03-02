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
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { FileText } from 'lucide-react';

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

  return (
    <PageTransition>
      <PageHeader
        title="Invoices"
        description="Manage and track your invoices"
      />

      <StaggerChildren className="space-y-6">
        {error && (
          <StaggerItem>
            <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
              {error}
            </div>
          </StaggerItem>
        )}

        {invoices.length === 0 ? (
          <StaggerItem>
            <Card>
              <EmptyState
                icon={FileText}
                title="No invoices yet"
                description="Create a client and assign a plan to generate an invoice"
                actionLabel="Add Client"
                actionHref="/dashboard/clients/new"
              />
            </Card>
          </StaggerItem>
        ) : (
          <StaggerItem>
            <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-bg-hover transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{invoice.client_name || 'Unknown Client'}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'not set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-sm font-semibold text-text-primary">
                      ₹{(invoice.amount ? Number(invoice.amount) : 0).toLocaleString(currencyLocale)}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                </Link>
              ))}
            </div>
          </StaggerItem>
        )}
      </StaggerChildren>
    </PageTransition>
  );
}
