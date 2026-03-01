import { auth } from '@/lib/auth';
import { getDeliverableById, getDeliverableFiles, getDeliverableComments, updateDeliverableStatus } from '@/lib/db-queries';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deliverable = await getDeliverableById(params.id, session.user.agencyId);

    if (!deliverable) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const files = await getDeliverableFiles(params.id);
    const comments = await getDeliverableComments(params.id);

    return Response.json({ deliverable, files, comments });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return Response.json({ error: 'Failed to fetch deliverable' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await request.json();

    const updated = await updateDeliverableStatus(params.id, session.user.agencyId, status);

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return Response.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
