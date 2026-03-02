import { auth } from '@/lib/auth';
import { createPlanItem, getPlanById } from '@/lib/db-queries';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    // Verify plan belongs to this agency
    const plan = await getPlanById(id, session.user.agencyId);
    if (!plan) return Response.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    if (!body.deliverableType || typeof body.deliverableType !== 'string' || !body.deliverableType.trim()) {
      return Response.json({ error: 'deliverableType is required' }, { status: 400 });
    }

    const item = await createPlanItem(
      id,
      body.deliverableType.trim(),
      body.qty !== undefined ? Number(body.qty) : 1,
      body.recurrence || 'monthly'
    );
    return Response.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating plan item:', error);
    return Response.json({ error: 'Failed to create plan item' }, { status: 500 });
  }
}
