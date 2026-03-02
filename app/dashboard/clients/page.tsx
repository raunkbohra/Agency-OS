import { auth } from '@/lib/auth';
import {
  getClientsWithPlans,
  Client,
} from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Users } from 'lucide-react';
import CopyOnboardingLink from '@/components/CopyOnboardingLink';

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let agencyId = session.user.agencyId;
  let clients: (Client & { planName?: string })[] = [];
  let error: string | null = null;

  try {
    // Get clients for this agency with their plan information
    clients = await getClientsWithPlans(agencyId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load clients';
  }

  return (
    <PageTransition>
      <PageHeader
        title="Clients"
        description="Manage your clients and their plans"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <CopyOnboardingLink agencyId={agencyId!} />
            <Link href="/dashboard/clients/new" className="inline-flex items-center px-3 py-2 text-sm bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors">
              Add Client
            </Link>
          </div>
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
            {/* Mobile: compact divided list */}
            <div className="sm:hidden bg-bg-secondary border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
              {clients.map((client) => (
                <Link key={client.id} href={`/dashboard/clients/${client.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-bg-hover transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{client.name}</p>
                    <p className="text-xs text-text-tertiary truncate mt-0.5">{client.email}</p>
                  </div>
                  {client.planName && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg-tertiary text-text-secondary border border-border-default flex-shrink-0">
                      {client.planName}
                    </span>
                  )}
                </Link>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-bg-hover transition-colors duration-fast">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">
                          <Link href={`/dashboard/clients/${client.id}`} className="hover:text-accent-blue transition-colors">{client.name}</Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.company_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{client.planName || '—'}</td>
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
