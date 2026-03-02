import { auth } from '@/lib/auth';
import { getPlansByAgency, getAgenciesByOwnerId, createAgency } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card } from '@/components/ui/card';
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
          <Link href="/dashboard/plans/new" className="inline-flex items-center px-3 py-2 text-sm bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors">
            Create Plan
          </Link>
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
            {/* Mobile: compact divided list */}
            <div className="sm:hidden bg-bg-secondary border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
              {plans.map((plan) => (
                <Link key={plan.id} href={`/dashboard/plans/${plan.id}`} className="flex items-center justify-between px-4 py-3.5 hover:bg-bg-hover transition-colors gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-accent-blue/10 flex-shrink-0">
                      <Package className="h-3.5 w-3.5 text-accent-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">{plan.name}</p>
                      <p className="text-xs text-text-tertiary capitalize mt-0.5">{plan.billing_cycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-text-primary">
                      NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                  </div>
                </Link>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-bg-hover transition-colors duration-fast">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">
                          <Link href={`/dashboard/plans/${plan.id}`} className="hover:text-accent-blue transition-colors">{plan.name}</Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">{plan.billing_cycle}</td>
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
