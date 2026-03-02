import { auth } from '@/lib/auth';
import { updateDeliverablesBulk } from '@/lib/db-queries';

// Valid deliverable status values - must match the Deliverable interface in db-queries.ts
const VALID_STATUSES = ['draft', 'in_review', 'approved', 'changes_requested', 'done'] as const;
type ValidDeliverableStatus = typeof VALID_STATUSES[number];

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, status } = body;

    // Validate ids is a non-empty array of strings
    if (!Array.isArray(ids)) {
      return Response.json({ error: 'ids must be an array' }, { status: 400 });
    }

    if (ids.length === 0) {
      return Response.json({ updated: 0, total: 0 });
    }

    if (!ids.every((id) => typeof id === 'string')) {
      return Response.json({ error: 'ids must be an array of strings' }, { status: 400 });
    }

    // Validate status is a valid deliverable status
    if (!status || !VALID_STATUSES.includes(status as ValidDeliverableStatus)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await updateDeliverablesBulk(ids, session.user.agencyId, status);

    return Response.json(result);
  } catch (error) {
    console.error('Error bulk updating deliverables:', error);
    return Response.json({ error: 'Failed to bulk update deliverables' }, { status: 500 });
  }
}
