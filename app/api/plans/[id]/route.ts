import { auth } from '@/lib/auth';
import { updatePlan, deletePlan } from '@/lib/db-queries';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const plan = await updatePlan(
      id,
      session.user.agencyId,
      body.name,
      body.price !== undefined ? Number(body.price) : undefined,
      body.billingCycle,
      body.description
    );
    if (!plan) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return Response.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const ok = await deletePlan(id, session.user.agencyId);
    if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return Response.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
