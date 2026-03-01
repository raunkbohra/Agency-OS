import { auth } from '@/lib/auth';
import { updateAgencyPaymentMethod } from '@/lib/db-queries';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const { id } = await params;

    const result = await updateAgencyPaymentMethod(id, session.user.agencyId, updates);
    return Response.json(result);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return Response.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}
