import { auth } from '@/lib/auth';
import { getClientsByAgency } from '@/lib/db-queries';

export async function GET() {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const clients = await getClientsByAgency(session.user.agencyId);
    return Response.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return Response.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
