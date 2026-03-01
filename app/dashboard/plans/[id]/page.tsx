import { auth } from '@/lib/auth';
import { getPlanById, getPlanItemsByPlan } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';

interface PlanDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { id } = await params;

  let plan: any = null;
  let planItems: any[] = [];
  let error = null;

  try {
    plan = await getPlanById(id, session.user.agencyId!);
    if (!plan) {
      notFound();
    }
    planItems = await getPlanItemsByPlan(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load plan';
  }

  if (error) {
    return (
      <div>
        <Link
          href="/dashboard/plans"
          className="text-accent-blue hover:text-accent-blue/90 font-medium mb-8 inline-block"
        >
          ← Back to Plans
        </Link>
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!plan) {
    notFound();
  }

  return (
    <PageTransition>
      <PageHeader
        title={plan.name}
        description="Plan Details"
        actions={
          <Link
            href="/dashboard/plans"
            className="text-accent-blue hover:text-accent-blue/90 font-medium"
          >
            Back to Plans
          </Link>
        }
      />

      <ScrollReveal><div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-bg-secondary border border-border-default rounded-lg p-6">
          <h1 className="text-3xl font-bold text-text-primary mb-6">{plan.name}</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Price
              </label>
              <p className="text-lg font-semibold text-text-primary">
                {Number(plan.price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} NPR
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Billing Cycle
              </label>
              <p className="text-lg font-semibold text-text-primary capitalize">
                {plan.billing_cycle}
              </p>
            </div>

            {plan.description && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description
                </label>
                <p className="text-text-secondary">{plan.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Created
              </label>
              <p className="text-sm text-text-secondary">
                {new Date(plan.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border-default flex gap-4">
            <button
              className="px-4 py-2 bg-accent-blue text-white rounded-md font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Edit Plan
            </button>
            <button
              className="px-4 py-2 border border-accent-red/20 text-accent-red rounded-md font-medium hover:bg-accent-red/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Delete Plan
            </button>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Plan Items</h2>
          {planItems.length === 0 ? (
            <p className="text-sm text-text-secondary">No items yet</p>
          ) : (
            <ul className="space-y-3">
              {planItems.map((item) => (
                <li
                  key={item.id}
                  className="pb-3 border-b border-border-default last:border-b-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-text-primary">
                    {item.deliverable_type}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {item.qty}x {item.recurrence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div></ScrollReveal>
    </PageTransition>
  );
}
