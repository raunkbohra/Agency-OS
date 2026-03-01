'use server';

import { auth } from '@/lib/auth';
import {
  createClient,
  createClientPlan,
  getPlansByAgency,
  getPlanById,
  getAgenciesByOwnerId,
  createAgency,
  createInvoice,
  addInvoiceItem,
  Plan,
} from '@/lib/db-queries';
import { SimpleClientForm } from '@/components/SimpleClientForm';
import { redirect } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';

async function handleCreateClient(formData: FormData) {
  'use server';

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const companyName = formData.get('companyName') as string;
  const planId = formData.get('planId') as string;

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

    // Create the client
    const client = await createClient(
      agencyId,
      name,
      email,
      undefined,
      companyName
    );

    // Assign plan to client
    await createClientPlan(client.id, planId, new Date());

    // Get the plan to use its price for the invoice
    const plan = await getPlanById(planId, agencyId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Auto-generate first invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Due in 15 days

    const invoice = await createInvoice(
      agencyId,
      client.id,
      Number(plan.price),
      dueDate.toISOString()
    );

    // Add invoice item
    await addInvoiceItem(
      invoice.id,
      `${plan.name} - Monthly Retainer`,
      1,
      Number(plan.price)
    );
  } catch (error) {
    console.error('Failed to create client:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create client');
  }

  redirect('/dashboard/clients');
}

export default async function NewClientPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  let agencyId: string | null = null;
  let plans: Plan[] = [];
  let error: string | null = null;

  try {
    // Get or create agency
    const agencies = await getAgenciesByOwnerId(session.user.id);

    if (agencies.length === 0) {
      const newAgency = await createAgency(`Agency for ${session.user.email}`, session.user.id);
      agencyId = newAgency.id;
    } else {
      agencyId = agencies[0].id;
    }

    // Get plans for this agency
    if (agencyId) {
      plans = await getPlansByAgency(agencyId);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load plans';
  }

  return (
    <PageTransition className="max-w-2xl">
      <PageHeader title="Add New Client" description="Create a new client and assign a plan" />

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <p className="text-text-secondary mb-4">You need to create at least one plan before adding a client.</p>
          <a
            href="/dashboard/plans/new"
            className="inline-block bg-accent-blue text-white py-2 px-4 rounded-md font-medium hover:bg-accent-blue/90 transition-colors"
          >
            Create a Plan
          </a>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <SimpleClientForm action={handleCreateClient} plans={plans} />
        </div>
      )}
    </PageTransition>
  );
}
