import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getDeliverableById, getDeliverableFiles, getDeliverableComments, getDeliverableItems, updateDeliverableStatus, updateDeliverableItemStatus } from '@/lib/db-queries';
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

    const [files, comments, items] = await Promise.all([
      getDeliverableFiles(id),
      getDeliverableComments(id),
      getDeliverableItems(id),
    ]);

    return Response.json({ deliverable, files, comments, items });
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
    const body = await request.json();
    const { id } = await params;

    // Update title if provided
    if (body.title !== undefined) {
      const titleTrimmed = body.title.trim();
      if (!titleTrimmed) {
        return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      const result = await db.query(
        `UPDATE deliverables SET title = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *`,
        [titleTrimmed, id, session.user.agencyId]
      );
      if (!body.status && !body.itemId) return Response.json(result.rows[0]);
    }

    // Update individual item status
    if (body.itemId && body.itemStatus) {
      const item = await updateDeliverableItemStatus(body.itemId, id, body.itemStatus);
      const items = await getDeliverableItems(id);
      const deliverable = await getDeliverableById(id, session.user.agencyId);
      return Response.json({ item, bundleStatus: deliverable?.status, items });
    }

    // Update bundle status directly
    if (body.status) {
      const updated = await updateDeliverableStatus(id, session.user.agencyId, body.status);

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
    }

    return Response.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return Response.json({ error: 'Failed to update deliverable' }, { status: 500 });
  }
}
