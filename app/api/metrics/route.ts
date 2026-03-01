import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import { calculateFinancialMetrics, calculateOperationalMetrics } from '@/lib/metrics-calculator';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agencies = await getAgenciesByOwnerId(session.user.id);
    const agencyId = agencies[0]?.id;

    if (!agencyId) {
      return Response.json({ error: 'No agency found' }, { status: 404 });
    }

    const financialMetrics = await calculateFinancialMetrics(agencyId);
    const operationalMetrics = await calculateOperationalMetrics(agencyId);

    return Response.json({
      ...financialMetrics,
      ...operationalMetrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
