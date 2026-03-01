import { auth } from '@/lib/auth';
import { addAgencyPaymentMethod, getAgencyPaymentMethods } from '@/lib/db-queries';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { providerId, credentials } = await request.json();

    const result = await addAgencyPaymentMethod({
      agencyId: session.user.agencyId,
      providerId,
      credentials,
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error adding payment method:', error);
    return Response.json({ error: 'Failed to add payment method' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const methods = await getAgencyPaymentMethods(session.user.agencyId);
    return Response.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return Response.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}
