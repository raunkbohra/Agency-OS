import { auth } from '@/lib/auth';
import { getDeliverableById } from '@/lib/db-queries';
import DeliverableDetail from '@/components/DeliverableDetail';
import { redirect } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';

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
    return (
      <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">
        Deliverable not found
      </div>
    );
  }

  return (
    <PageTransition>
      <DeliverableDetail deliverable={deliverable} deliverableId={params.id} />
    </PageTransition>
  );
}
