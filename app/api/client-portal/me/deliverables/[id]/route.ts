import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { getDeliverableFiles, getDeliverableComments } from '@/lib/db-queries';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch deliverable - verify it belongs to this client
    // Using a direct query since getDeliverableById checks agency, not client
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM deliverables WHERE id = $1 AND client_id = $2 LIMIT 1`,
      [id, session.clientId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const deliverable = result.rows[0];

    // Fetch files and comments
    const [files, comments] = await Promise.all([
      getDeliverableFiles(id),
      getDeliverableComments(id),
    ]);

    return NextResponse.json({
      deliverable,
      files: files || [],
      comments: comments || [],
    });
  } catch (error) {
    console.error('Error fetching client deliverable:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
