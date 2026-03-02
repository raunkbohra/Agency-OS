import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getPlansByAgency, getClientsByAgency } from '@/lib/db-queries';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
import { Card } from '@/components/ui/card';
import { MetricCard } from '@/components/shared/metric-card';
import { GlassCard } from '@/components/shared/glass-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Plus, Users, FileText, BarChart3, Package } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const agencyId = session?.user?.agencyId;
  const name = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? '';

  let plans: any[] = [];
  let clients: any[] = [];

  if (agencyId) {
    [plans, clients] = await Promise.all([
      getPlansByAgency(agencyId).catch(() => []),
      getClientsByAgency(agencyId).catch(() => []),
    ]);
  }

  const firstName = name.split(' ')[0];

  return (
    <PageTransition>
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ''}`}
        description="Manage your agency from one place"
      />

      <StaggerChildren className="space-y-5 md:space-y-8">
        {/* Metrics Row */}
        <StaggerItem>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <MetricCard
              label="Monthly Revenue"
              value={0}
              format="currency"
              prefix="$"
              trend={{ value: 0, direction: 'up' }}
            />
            <MetricCard
              label="Total Clients"
              value={clients.length}
              format="integer"
            />
            <MetricCard
              label="Deliverables"
              value={0}
              format="integer"
            />
            <MetricCard
              label="Active Plans"
              value={plans.length}
              format="integer"
            />
          </div>
        </StaggerItem>

        {/* Quick Actions */}
        <StaggerItem>
          <div>
            <h3 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">Quick Actions</h3>

            {/* Mobile: compact horizontal pills */}
            <div className="flex gap-2 md:hidden">
              <Link
                href="/dashboard/plans/new"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
              >
                <div className="p-1 rounded-md bg-accent-blue/10 flex-shrink-0">
                  <Plus className="h-3.5 w-3.5 text-accent-blue" />
                </div>
                <span className="text-xs font-medium text-text-primary">New Plan</span>
              </Link>
              <Link
                href="/dashboard/clients/new"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
              >
                <div className="p-1 rounded-md bg-accent-green/10 flex-shrink-0">
                  <Users className="h-3.5 w-3.5 text-accent-green" />
                </div>
                <span className="text-xs font-medium text-text-primary">Add Client</span>
              </Link>
              <Link
                href="/dashboard/invoices"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-bg-secondary border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
              >
                <div className="p-1 rounded-md bg-accent-amber/10 flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 text-accent-amber" />
                </div>
                <span className="text-xs font-medium text-text-primary">Invoices</span>
              </Link>
            </div>

            {/* Desktop: full cards */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              <GlassCard className="p-6 hover:border-border-hover transition-all duration-fast cursor-pointer">
                <Link href="/dashboard/plans/new" className="block h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-blue/10">
                      <Plus className="h-5 w-5 text-accent-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Create Plan</p>
                      <p className="text-sm text-text-secondary mt-1">Set up a new service plan</p>
                    </div>
                  </div>
                </Link>
              </GlassCard>

              <GlassCard className="p-6 hover:border-border-hover transition-all duration-fast cursor-pointer">
                <Link href="/dashboard/clients/new" className="block h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-green/10">
                      <Users className="h-5 w-5 text-accent-green" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Add Client</p>
                      <p className="text-sm text-text-secondary mt-1">Onboard a new client</p>
                    </div>
                  </div>
                </Link>
              </GlassCard>

              <GlassCard className="p-6 hover:border-border-hover transition-all duration-fast cursor-pointer">
                <Link href="/dashboard/invoices" className="block h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent-amber/10">
                      <FileText className="h-5 w-5 text-accent-amber" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">View Invoices</p>
                      <p className="text-sm text-text-secondary mt-1">Check invoice status</p>
                    </div>
                  </div>
                </Link>
              </GlassCard>
            </div>
          </div>
        </StaggerItem>

        {/* Plans Section */}
        <StaggerItem>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Your Plans</h3>
              <Link href="/dashboard/plans" className="text-xs font-medium text-accent-blue hover:text-accent-blue/80">View all</Link>
            </div>
            {plans.length === 0 ? (
              <Card>
                <EmptyState
                  icon={BarChart3}
                  title="No plans yet"
                  description="Create your first service plan to get started"
                  actionLabel="Create Plan"
                  actionHref="/dashboard/plans/new"
                />
              </Card>
            ) : (
              <Card>
                <div className="divide-y divide-border-default">
                  {plans.slice(0, 5).map((plan) => (
                    <Link key={plan.id} href={`/dashboard/plans/${plan.id}`} className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 hover:bg-bg-hover transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-accent-blue/10 flex-shrink-0">
                          <Package className="h-3.5 w-3.5 text-accent-blue" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{plan.name}</p>
                          <p className="text-xs text-text-secondary capitalize">{plan.billing_cycle}</p>
                        </div>
                      </div>
                      <span className="text-sm text-text-primary font-medium">
                        ${Number(plan.price).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </StaggerItem>
      </StaggerChildren>
    </PageTransition>
  );
}
