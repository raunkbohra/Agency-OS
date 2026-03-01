import { auth } from '@/lib/auth';
import { addDeliverableComment } from '@/lib/db-queries';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, isRevisionRequest } = await request.json();

    const result = await addDeliverableComment({
      deliverableId: params.id,
      userId: session.user.id,
      comment,
      isRevisionRequest,
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
