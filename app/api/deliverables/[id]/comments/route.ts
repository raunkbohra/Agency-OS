import { auth } from '@/lib/auth';
import { addDeliverableComment, getDeliverableById, getClientById } from '@/lib/db-queries';
import { sendRevisionRequestNotification } from '@/lib/send-deliverable-notification';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { comment, isRevisionRequest } = await request.json();
    const { id } = await params;

    const result = await addDeliverableComment({
      deliverableId: id,
      userId: session.user.id,
      comment,
      isRevisionRequest,
    });

    // Send email notification if this is a revision request
    if (isRevisionRequest && session.user?.agencyId) {
      try {
        const deliverable = await getDeliverableById(id, session.user.agencyId);
        const client = deliverable ? await getClientById(deliverable.client_id) : null;

        if (client && client.email) {
          const excerpt = comment.substring(0, 100) + (comment.length > 100 ? '...' : '');
          await sendRevisionRequestNotification({
            clientEmail: client.email,
            clientName: client.name,
            deliverableTitle: deliverable?.title || 'Deliverable',
            commentExcerpt: excerpt,
            portalLink: `/client-portal/${client.token || 'unknown'}`,
          });
        }
      } catch (emailError) {
        console.error('Failed to send revision notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return Response.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
