import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import MetricsDashboard from '@/components/MetricsDashboard';
import { redirect } from 'next/navigation';

export default async function MetricsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Business Metrics</h1>
      <p className="text-gray-600 mb-6">Track your agency's financial and operational performance</p>

      <MetricsDashboard agencyId={agencyId} />
    </div>
  );
}
