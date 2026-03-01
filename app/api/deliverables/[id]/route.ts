import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getDeliverableById, getDeliverableFiles, getDeliverableComments, updateDeliverableStatus } from '@/lib/db-queries';
import { checkForScopeCreep } from '@/lib/scope-checker';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deliverable = await getDeliverableById(id, session.user.agencyId);

    if (!deliverable) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const files = await getDeliverableFiles(id);
    const comments = await getDeliverableComments(id);

    return Response.json({ deliverable, files, comments });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return Response.json({ error: 'Failed to fetch deliverable' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await request.json();
    const { id } = await params;

    const updated = await updateDeliverableStatus(id, session.user.agencyId, status);

    // Trigger scope check
    if (updated.client_id && updated.status === 'in_review') {
      const clientPlanResult = await db.query(
        `SELECT id FROM client_plans WHERE client_id = $1 LIMIT 1`,
        [updated.client_id]
      );

      if (clientPlanResult.rows.length > 0) {
        await checkForScopeCreep(
          updated.client_id,
          session.user.agencyId,
          clientPlanResult.rows[0].id
        );
      }
    }

    return Response.json(updated);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return Response.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
