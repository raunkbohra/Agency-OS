import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const result = await db.query(
      `SELECT cp.id as client_plan_id, cp.plan_id, cp.status, p.name as plan_name
       FROM client_plans cp
       JOIN plans p ON cp.plan_id = p.id
       JOIN clients c ON cp.client_id = c.id
       WHERE cp.client_id = $1 AND c.agency_id = $2
       ORDER BY cp.created_at DESC`,
      [id, session.user.agencyId]
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error('Error fetching client plans:', error);
    return Response.json({ error: 'Failed to fetch client plans' }, { status: 500 });
  }
}
