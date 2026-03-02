import { auth } from '@/lib/auth';
import { getClientById, getAgencyById } from '@/lib/db-queries';
import { sendClientEmail } from '@/lib/email';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const client = await getClientById(id, session.user.agencyId);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const agency = await getAgencyById(session.user.agencyId);
    const { subject, body } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return Response.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    await sendClientEmail({
      to: client.email,
      clientName: client.name,
      agencyName: agency?.name ?? 'Agency OS',
      subject: subject.trim(),
      body: body.trim(),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to send email:', err);
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
