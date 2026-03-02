import { auth } from '@/lib/auth';
import { getPlansByAgency } from '@/lib/db-queries';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await getPlansByAgency(session.user.agencyId);
    return Response.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return Response.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
