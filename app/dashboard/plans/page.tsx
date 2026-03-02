import { auth } from '@/lib/auth';
import { getPlansByAgency, getAgenciesByOwnerId, createAgency } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Package, ArrowRight } from 'lucide-react';

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  let agencyId: string | null = null;
  let plans: any[] = [];
  let error: string | null = null;

  try {
    const agencies = await getAgenciesByOwnerId(session.user.id);
    agencyId = agencies.length === 0
      ? (await createAgency(`Agency for ${session.user.email}`, session.user.id)).id
      : agencies[0].id;
    if (agencyId) plans = await getPlansByAgency(agencyId);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load plans';
  }

  return (
    <PageTransition>
      <PageHeader
        title="Plans"
        description="Manage your service plans"
        actions={
          <Button variant="primary" asChild>
            <Link href="/dashboard/plans/new">Create Plan</Link>
          </Button>
        }
      />

      <StaggerChildren className="space-y-4">
        {error && (
          <StaggerItem>
            <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">{error}</div>
          </StaggerItem>
        )}

        {plans.length === 0 ? (
          <StaggerItem>
            <Card>
              <EmptyState
                icon={Package}
                title="No plans yet"
                description="Create your first service plan to start managing client deliverables"
                actionLabel="Create Plan"
                actionHref="/dashboard/plans/new"
              />
            </Card>
          </StaggerItem>
        ) : (
          <StaggerItem>
            {/* Mobile: card list */}
            <div className="sm:hidden space-y-2">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <Link href={`/dashboard/plans/${plan.id}`} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-accent-blue/10 flex-shrink-0">
                        <Package className="h-4 w-4 text-accent-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{plan.name}</p>
                        <p className="text-xs text-text-tertiary capitalize mt-0.5">{plan.billing_cycle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-text-primary">
                        NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <ArrowRight className="h-4 w-4 text-text-tertiary" />
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Plan Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Billing Cycle</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-bg-hover transition-colors duration-fast">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{plan.name}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">{plan.billing_cycle}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/plans/${plan.id}`}>View</Link>
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
