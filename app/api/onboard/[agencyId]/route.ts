import { db } from '@/lib/db';
import { createClient } from '@/lib/db-queries';

export async function GET(req: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  // Return public agency info for the form header
  const { agencyId } = await params;
  const result = await db.query('SELECT id, name FROM agencies WHERE id = $1', [agencyId]);
  if (!result.rows[0]) return Response.json({ error: 'Agency not found' }, { status: 404 });
  return Response.json({ id: result.rows[0].id, name: result.rows[0].name });
}

export async function POST(req: Request, { params }: { params: Promise<{ agencyId: string }> }) {
  const { agencyId } = await params;

  // Verify agency exists
  const agencyResult = await db.query('SELECT id, name FROM agencies WHERE id = $1', [agencyId]);
  if (!agencyResult.rows[0]) return Response.json({ error: 'Agency not found' }, { status: 404 });

  const body = await req.json();
  const { name, email, companyName, phone } = body;

  if (!name?.trim() || !email?.trim()) {
    return Response.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Check for duplicate email in this agency
  const existing = await db.query('SELECT id FROM clients WHERE agency_id = $1 AND email = $2', [agencyId, email.toLowerCase().trim()]);
  if (existing.rows[0]) return Response.json({ error: 'A client with this email already exists' }, { status: 409 });

  try {
    const client = await createClient(agencyId, name.trim(), email.toLowerCase().trim(), phone?.trim() || undefined, companyName?.trim() || undefined);
    return Response.json({ success: true, client: { id: client.id, name: client.name } }, { status: 201 });
  } catch (err) {
    return Response.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
