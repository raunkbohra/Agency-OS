import { auth } from '@/lib/auth';
import { getDeliverablesByAgency, createDeliverable } from '@/lib/db-queries';

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { clientId, planId, title, monthYear, dueDate } = body;

    if (!clientId || !title || !monthYear) {
      return Response.json({ error: 'clientId, title and monthYear are required' }, { status: 400 });
    }

    if (!planId) {
      return Response.json({ error: 'planId is required' }, { status: 400 });
    }

    const deliverable = await createDeliverable({
      agencyId: session.user.agencyId,
      clientId,
      planId,
      title,
      monthYear,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    return Response.json(deliverable, { status: 201 });
  } catch (err) {
    console.error('Error creating deliverable:', err);
    return Response.json({ error: 'Failed to create deliverable' }, { status: 500 });
  }
}
