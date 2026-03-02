import { auth } from '@/lib/auth';
import { createPlan, getAgenciesByOwnerId, createAgency } from '@/lib/db-queries';
import { PlanForm } from '@/components/PlanForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';

async function handleCreatePlan(formData: {
  name: string;
  price: number;
  billingCycle: string;
  description?: string;
}) {
  'use server';

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // Get or create agency
    let agencies = await getAgenciesByOwnerId(session.user.id);
    let agencyId: string;

    if (agencies.length === 0) {
      const newAgency = await createAgency(`Agency for ${session.user.email}`, session.user.id);
      agencyId = newAgency.id;
    } else {
      agencyId = agencies[0].id;
    }

    await createPlan(agencyId, formData.name, formData.price, formData.billingCycle, formData.description);
  } catch (error) {
    console.error('Failed to create plan:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create plan');
  }

  redirect('/dashboard/plans');
}

export default async function NewPlanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <PageTransition>
      <Link
        href="/dashboard/plans"
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Plans
      </Link>

      <div className="max-w-xl mx-auto">
        <PageHeader title="Create New Plan" description="Add a new service plan to your offerings" />

        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 sm:p-6">
          <PlanForm onSubmit={handleCreatePlan} />
        </div>
      </div>
    </PageTransition>
  );
}
