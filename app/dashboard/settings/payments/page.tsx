import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId, getAgencyPaymentMethods } from '@/lib/db-queries';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';

export default async function PaymentSettingsPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  const paymentMethods = await getAgencyPaymentMethods(session.user.agencyId);

  return (
    <PageTransition>
      <PageHeader
        title="Payment Methods"
        description="Configure your payment providers and settings"
      />

      <PaymentMethodsManager initialMethods={paymentMethods} />
    </PageTransition>
  );
}
