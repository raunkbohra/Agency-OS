import { auth } from '@/lib/auth';
import { getDeliverablesByAgency, getDeliverablesFiltered, createDeliverable } from '@/lib/db-queries';

// Valid status values
const VALID_STATUSES = ['all', 'draft', 'in_review', 'approved', 'changes_requested', 'done'] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// Valid sort values
const VALID_SORTS = ['due_date', 'due_date_desc', 'client', 'status'] as const;
type ValidSort = typeof VALID_SORTS[number];

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const urgent = url.searchParams.get('urgent') === 'true';
    const sort = url.searchParams.get('sort') || 'due_date';

    // Validate status parameter
    if (!VALID_STATUSES.includes(status as ValidStatus)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate sort parameter
    if (!VALID_SORTS.includes(sort as ValidSort)) {
      return Response.json(
        { error: `Invalid sort. Must be one of: ${VALID_SORTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if any filters are applied
    const hasFilters = status !== 'all' || urgent || sort !== 'due_date';

    let deliverables;
    if (hasFilters) {
      // Use filtered query if any filters are applied
      deliverables = await getDeliverablesFiltered(session.user.agencyId, {
        statusFilter: status as ValidStatus,
        urgent,
        sort: sort as ValidSort,
      });
    } else {
      // Use the basic query if no filters
      deliverables = await getDeliverablesByAgency(session.user.agencyId);
    }

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
