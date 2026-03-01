import { auth } from '@/lib/auth';
import { getPlanById, getPlanItemsByPlan } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

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

  let plan = null;
  let planItems = [];
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
          className="text-blue-600 hover:text-blue-700 font-medium mb-8 inline-block"
        >
          ← Back to Plans
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!plan) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/dashboard/plans"
        className="text-blue-600 hover:text-blue-700 font-medium mb-8 inline-block"
      >
        ← Back to Plans
      </Link>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{plan.name}</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {Number(plan.price).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })} NPR
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Cycle
              </label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {plan.billing_cycle}
              </p>
            </div>

            {plan.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-gray-600">{plan.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-sm text-gray-600">
                {new Date(plan.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled
            >
              Edit Plan
            </button>
            <button
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Delete Plan
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Items</h2>
          {planItems.length === 0 ? (
            <p className="text-sm text-gray-600">No items yet</p>
          ) : (
            <ul className="space-y-3">
              {planItems.map((item) => (
                <li
                  key={item.id}
                  className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {item.deliverable_type}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.qty}x {item.recurrence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
