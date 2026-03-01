import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return Response.json({ error: 'Missing agencyId' }, { status: 400 });
    }

    const result = await db.query(
      `SELECT * FROM contracts WHERE agency_id = $1 ORDER BY created_at DESC`,
      [agencyId]
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return Response.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}
