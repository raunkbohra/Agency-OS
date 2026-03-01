import { auth } from '@/lib/auth';
import { getDeliverablesByAgency } from '@/lib/db-queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deliverables = await getDeliverablesByAgency(session.user.agencyId);
    return Response.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return Response.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
  }
}
