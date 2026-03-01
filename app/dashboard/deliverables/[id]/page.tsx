import { auth } from '@/lib/auth';
import { getDeliverableById } from '@/lib/db-queries';
import DeliverableDetail from '@/components/DeliverableDetail';
import { redirect } from 'next/navigation';

export default async function DeliverableDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  const deliverable = await getDeliverableById(params.id, session.user.agencyId);

  if (!deliverable) {
    return <div className="p-8">Deliverable not found</div>;
  }

  return (
    <div className="p-8">
      <DeliverableDetail deliverable={deliverable} deliverableId={params.id} />
    </div>
  );
}
