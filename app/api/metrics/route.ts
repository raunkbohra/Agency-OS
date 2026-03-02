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

    // Parallelize financial and operational metrics calculations
    // Use allSettled for resilience: if one fails, still return the other
    const [financialResult, operationalResult] = await Promise.allSettled([
      calculateFinancialMetrics(agencyId),
      calculateOperationalMetrics(agencyId),
    ]);

    const financialMetrics = financialResult.status === 'fulfilled' ? financialResult.value : {
      mrr: 0,
      arr: 0,
      collectionRate: 0,
      outstandingValue: 0,
    };
    const operationalMetrics = operationalResult.status === 'fulfilled' ? operationalResult.value : {
      completionPercentage: 0,
      onTimePercentage: 0,
      avgDaysToComplete: 0,
    };

    if (financialResult.status === 'rejected') {
      console.warn('Financial metrics calculation failed:', financialResult.reason);
    }
    if (operationalResult.status === 'rejected') {
      console.warn('Operational metrics calculation failed:', operationalResult.reason);
    }

    return Response.json({
      ...financialMetrics,
      ...operationalMetrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return Response.json({ error: 'Failed to calculate metrics' }, { status: 500 });
  }
}
