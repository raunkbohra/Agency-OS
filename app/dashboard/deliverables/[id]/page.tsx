import { auth } from '@/lib/auth';
import { getDeliverableById } from '@/lib/db-queries';
import DeliverableDetail from '@/components/DeliverableDetail';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageTransition } from '@/components/motion/page-transition';

export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  const { id } = await params;
  const deliverable = await getDeliverableById(id, session.user.agencyId);

  if (!deliverable) {
    return (
      <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">
        Deliverable not found
      </div>
    );
  }

  return (
    <PageTransition>
      <Link
        href="/dashboard/deliverables"
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Deliverables
      </Link>
      <DeliverableDetail deliverable={deliverable} deliverableId={id} />
    </PageTransition>
  );
}
