import { auth } from '@/lib/auth';
import {
  getClientsWithPlans,
  getAgenciesByOwnerId,
  createAgency,
  Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Users } from 'lucide-react';

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
    <PageTransition>
      <PageHeader
        title="Clients"
        description="Manage your clients and their plans"
        actions={
          <Button variant="primary" asChild>
            <Link href="/dashboard/clients/new">Add Client</Link>
          </Button>
        }
      />

      <StaggerChildren className="space-y-6">
        {error && (
          <StaggerItem>
            <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
              {error}
            </div>
          </StaggerItem>
        )}

        {clients.length === 0 ? (
          <StaggerItem>
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Users}
                  title="No clients yet"
                  description="Add your first client to start managing their plans and deliverables"
                  actionLabel="Add Client"
                  actionHref="/dashboard/clients/new"
                />
              </CardContent>
            </Card>
          </StaggerItem>
        ) : (
          <StaggerItem>
            {/* Mobile: card list */}
            <div className="sm:hidden space-y-2">
              {clients.map((client) => (
                <Card key={client.id}>
                  <Link href={`/dashboard/clients/${client.id}`} className="block p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{client.name}</p>
                        <p className="text-sm text-text-secondary truncate mt-0.5">{client.email}</p>
                        {client.company_name && (
                          <p className="text-xs text-text-tertiary mt-1">{client.company_name}</p>
                        )}
                      </div>
                      {client.planName && (
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-bg-tertiary text-text-secondary border border-border-default flex-shrink-0">
                          {client.planName}
                        </span>
                      )}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Desktop: table */}
            <Card className="hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Client Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Company</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-bg-hover transition-colors duration-fast">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{client.name}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.company_name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.planName || '-'}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/clients/${client.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </StaggerItem>
        )}
      </StaggerChildren>
    </PageTransition>
  );
}
