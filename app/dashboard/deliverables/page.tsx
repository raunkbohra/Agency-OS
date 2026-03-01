import { auth } from '@/lib/auth';
import DeliverablesList from '@/components/DeliverablesList';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';

export default async function DeliverablesPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  return (
    <PageTransition>
      <PageHeader
        title="Deliverables"
        description="Track all client deliverables and their status"
      />

      <DeliverablesList />
    </PageTransition>
  );
}
