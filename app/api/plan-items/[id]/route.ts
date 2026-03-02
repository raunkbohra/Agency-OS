import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    // Verify item belongs to this agency's plan before deleting
    const result = await db.query(
      `DELETE FROM plan_items pi
       USING plans p
       WHERE pi.id = $1
         AND pi.plan_id = p.id
         AND p.agency_id = $2`,
      [id, session.user.agencyId]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan item:', error);
    return Response.json({ error: 'Failed to delete plan item' }, { status: 500 });
  }
}
