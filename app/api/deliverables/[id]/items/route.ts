import { auth } from '@/lib/auth';
import { getDeliverableById, getDeliverableItems, addDeliverableItem, updateDeliverableItemStatus, deleteDeliverableItem } from '@/lib/db-queries';

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

    const items = await getDeliverableItems(id);
    return Response.json({ items });
  } catch (error) {
    console.error('Error fetching deliverable items:', error);
    return Response.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const { title, description, planItemId, sortOrder } = body;

    if (!title?.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await addDeliverableItem({
      deliverableId: id,
      title: title.trim(),
      description,
      planItemId,
      sortOrder,
    });

    return Response.json(item);
  } catch (error) {
    console.error('Error adding deliverable item:', error);
    return Response.json({ error: 'Failed to add item' }, { status: 500 });
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
    const { id } = await params;
    const deliverable = await getDeliverableById(id, session.user.agencyId);
    if (!deliverable) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, status, title } = body;

    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Update title if provided
    if (title !== undefined) {
      const trimmed = title.trim();
      if (!trimmed) {
        return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      const { db } = await import('@/lib/db');
      await db.query(
        `UPDATE deliverable_items SET title = $1, updated_at = NOW() WHERE id = $2 AND deliverable_id = $3`,
        [trimmed, itemId, id]
      );
    }

    // Update status if provided
    if (status) {
      await updateDeliverableItemStatus(itemId, id, status);
    }

    const items = await getDeliverableItems(id);
    const updatedDeliverable = await getDeliverableById(id, session.user.agencyId);
    const updatedItem = items.find(i => i.id === itemId);

    return Response.json({ item: updatedItem, items, bundleStatus: updatedDeliverable?.status });
  } catch (error) {
    console.error('Error updating deliverable item:', error);
    return Response.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
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

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 });
    }

    const deleted = await deleteDeliverableItem(itemId, id);
    if (!deleted) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting deliverable item:', error);
    return Response.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
