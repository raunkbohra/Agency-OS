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
import { generateDeliverablesForClientPlan, calcFirstInvoice } from '@/lib/generate-deliverables';
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
  const billingPolicy = (formData.get('billingStartPolicy') ?? 'next_month') as 'next_month' | 'prorated';

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

    // Get the plan (needed for invoice + immediate deliverable generation)
    const plan = await getPlanById(planId, agencyId);
    if (!plan) throw new Error('Plan not found');

    const startDate = new Date();
    await createClientPlan(client.id, planId, startDate, 'active', billingPolicy);

    // Generate deliverables respecting the per-client billing start policy
    await generateDeliverablesForClientPlan({
      client_id: client.id,
      plan_id: plan.id,
      agency_id: agencyId,
      start_date: startDate,
      billing_cycle: plan.billing_cycle,
      billing_start_policy: billingPolicy,
    }).catch((err) =>
      console.error('Failed to generate initial deliverables:', err)
    );

    // First invoice: amount + due date based on billing start policy
    const { amount, dueDate } = calcFirstInvoice(Number(plan.price), startDate, billingPolicy);
    const invoiceLabel =
      billingPolicy === 'prorated'
        ? `${plan.name} — Pro-rated (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        : `${plan.name} — ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    const invoice = await createInvoice(agencyId, client.id, amount, dueDate.toISOString());
    await addInvoiceItem(invoice.id, invoiceLabel, 1, amount);
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
    <PageTransition className="max-w-lg">
      <PageHeader title="Add New Client" description="Create a new client and assign a plan" />

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm mb-5">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <p className="text-sm text-text-secondary mb-4">You need to create at least one plan before adding a client.</p>
          <a
            href="/dashboard/plans/new"
            className="inline-flex items-center px-4 py-2 bg-accent-blue text-white text-sm rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
          >
            Create a Plan
          </a>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <SimpleClientForm action={handleCreateClient} plans={plans} />
        </div>
      )}
    </PageTransition>
  );
}
