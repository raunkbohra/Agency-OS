import { auth } from '@/lib/auth';
import DeliverablesList from '@/components/DeliverablesList';
import { redirect } from 'next/navigation';

export default async function DeliverablesPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
        <p className="text-gray-600 mt-1">Track all client deliverables</p>
      </div>

      <DeliverablesList />
    </div>
  );
}
