import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { setClientInviteToken, getClientById } from '@/lib/db-queries';
import { sendClientInviteEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: clientId } = await params;

  try {
    // Get client and verify agency ownership
    const client = await getClientById(clientId);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    if (client.agency_id !== session.user.agencyId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if client has already accepted invite
    if (client.invite_accepted) {
      return Response.json(
        { error: 'This client has already accepted their invitation' },
        { status: 409 }
      );
    }

    // Generate new invite token and expiry (72 hours)
    const newToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await setClientInviteToken(clientId, newToken, expiresAt);

    // Build setup URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/client-portal/setup/${newToken}`;

    // Get agency name
    const agencyResult = await db.query(
      'SELECT name FROM agencies WHERE id = $1',
      [session.user.agencyId]
    );
    const agencyName = agencyResult.rows[0]?.name || 'Agency';

    // Send invite email (non-blocking)
    sendClientInviteEmail({
      to: client.email,
      clientName: client.name,
      agencyName,
      setupUrl,
    }).catch(err => console.error('Failed to send resend invite email:', err));

    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to resend invite:', err);
    return Response.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}
