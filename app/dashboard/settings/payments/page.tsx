import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId, getAgencyPaymentMethods } from '@/lib/db-queries';
import PaymentMethodsManager from '@/components/PaymentMethodsManager';
import { redirect } from 'next/navigation';

export default async function PaymentSettingsPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  const paymentMethods = await getAgencyPaymentMethods(session.user.agencyId);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-gray-600 mt-1">Configure your payment providers</p>
      </div>

      <PaymentMethodsManager initialMethods={paymentMethods} />
    </div>
  );
}
