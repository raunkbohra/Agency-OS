import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import BillingPolicyToggle from '@/components/settings/BillingPolicyToggle';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.agencyId) redirect('/auth/signin');

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agency = agencies[0];

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Configure your agency preferences" />

      <div className="space-y-5 max-w-2xl">
        {/* Billing start policy */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">New Client Billing Start</h2>
            <p className="text-xs text-text-tertiary mt-1">
              How to handle billing and deliverables when a client joins mid-month or mid-period.
            </p>
          </div>
          <BillingPolicyToggle
            initialPolicy={(agency?.billing_start_policy ?? 'next_month') as 'next_month' | 'prorated'}
          />
        </div>
      </div>
    </PageTransition>
  );
}
