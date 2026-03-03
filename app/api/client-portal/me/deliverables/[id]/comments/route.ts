import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { addDeliverableComment } from '@/lib/db-queries';
import { getPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { comment } = await request.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Verify deliverable belongs to this client
    const pool = getPool();
    const deliverableResult = await pool.query(
      `SELECT * FROM deliverables WHERE id = $1 AND client_id = $2 LIMIT 1`,
      [id, session.clientId]
    );

    if (deliverableResult.rows.length === 0) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    // Get client info for the comment
    const clientResult = await pool.query(
      `SELECT name FROM clients WHERE id = $1`,
      [session.clientId]
    );

    const clientName = clientResult.rows[0]?.name || 'Unknown Client';

    // Add comment directly to database
    const result = await pool.query(
      `INSERT INTO deliverable_comments (deliverable_id, user_id, comment, is_revision_request, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, user_id, comment, is_revision_request, created_at`,
      [id, session.clientId, comment, false]
    );

    const newComment = result.rows[0];

    return NextResponse.json({
      id: newComment.id,
      author_id: newComment.user_id,
      author_name: clientName,
      comment_text: newComment.comment,
      is_revision_request: newComment.is_revision_request,
      created_at: newComment.created_at,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
