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
import { Button } from '@/components/ui/button';
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
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} interactive>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex-1 grid grid-cols-3 gap-8">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">
                          Client
                        </p>
                        <p className="font-medium text-text-primary">
                          {invoice.client_name || 'Unknown Client'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">
                          Amount
                        </p>
                        <p className="font-medium text-text-primary">
                          ₹{(invoice.amount ? Number(invoice.amount) : 0).toLocaleString(currencyLocale)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">
                          Due Date
                        </p>
                        <p className="font-medium text-text-primary">
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString('en-IN')
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                      <StatusBadge status={invoice.status} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </StaggerItem>
        )}
      </StaggerChildren>
    </PageTransition>
  );
}
