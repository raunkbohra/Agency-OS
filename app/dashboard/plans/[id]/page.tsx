import { auth } from '@/lib/auth';
import { getPlanById, getPlanItemsByPlan } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ChevronLeft, Package, Calendar, DollarSign, RefreshCw } from 'lucide-react';

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const { id } = await params;
  let plan: any = null;
  let planItems: any[] = [];
  let error = null;

  try {
    plan = await getPlanById(id, session.user.agencyId!);
    if (!plan) notFound();
    planItems = await getPlanItemsByPlan(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load plan';
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Plans
        </Link>
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  if (!plan) notFound();

  return (
    <PageTransition>
      <PageHeader
        title={plan.name}
        description="Plan details"
        actions={
          <Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
            <ChevronLeft className="h-4 w-4" /> Plans
          </Link>
        }
      />

      <ScrollReveal>
        {/* Mobile: single column; lg: two-column (2/3 + 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main card */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-xl p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
              {plan.description && (
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{plan.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-text-tertiary" />
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Price</p>
                </div>
                <p className="text-lg font-bold text-text-primary">
                  NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default">
                <div className="flex items-center gap-1.5 mb-2">
                  <RefreshCw className="h-3.5 w-3.5 text-text-tertiary" />
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Billing</p>
                </div>
                <p className="text-lg font-bold text-text-primary capitalize">{plan.billing_cycle}</p>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Created</p>
                </div>
                <p className="text-sm font-semibold text-text-primary">
                  {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border-default flex flex-wrap gap-3">
              <button
                className="px-4 py-2 text-sm bg-accent-blue text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                Edit Plan
              </button>
              <button
                className="px-4 py-2 text-sm border border-accent-red/30 text-accent-red rounded-lg font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                Delete Plan
              </button>
            </div>
          </div>

          {/* Plan items sidebar */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package className="h-4 w-4 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">Deliverables</h2>
            </div>
            {planItems.length === 0 ? (
              <p className="text-sm text-text-tertiary">No items added yet.</p>
            ) : (
              <ul className="space-y-3">
                {planItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 pb-3 border-b border-border-default last:border-b-0 last:pb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.deliverable_type}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{item.qty}× per {item.recurrence}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </ScrollReveal>
    </PageTransition>
  );
}
