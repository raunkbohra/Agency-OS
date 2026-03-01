import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import MetricsDashboard from '@/components/MetricsDashboard';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';

export default async function MetricsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">No agency found</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Business Metrics"
        description="Track your agency's financial and operational performance"
      />

      <MetricsDashboard agencyId={agencyId} />
    </PageTransition>
  );
}
