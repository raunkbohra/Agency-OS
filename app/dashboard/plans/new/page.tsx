'use server';

import { auth } from '@/lib/auth';
import { createPlan, getAgenciesByOwnerId, createAgency } from '@/lib/db-queries';
import { PlanForm } from '@/components/PlanForm';
import { redirect } from 'next/navigation';

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
    redirect('/dashboard/plans');
  } catch (error) {
    console.error('Failed to create plan:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create plan');
  }
}

export default async function NewPlanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Plan</h1>
        <p className="text-gray-600 mt-1">Add a new service plan to your offerings</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <PlanForm onSubmit={handleCreatePlan} />
      </div>
    </div>
  );
}
