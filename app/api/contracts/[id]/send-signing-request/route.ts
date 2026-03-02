import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSigningToken } from '@/lib/db-queries';
import { sendSigningRequestEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check auth - GET session, verify user.agencyId exists
    const session = await auth();

    if (!session?.user?.agencyId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contract ID from params
    const { id } = await params;

    // 2. Get contract details from database
    const contractResult = await db.query(
      `SELECT c.*, cl.name as client_name, cl.email as client_email, a.name as agency_name
       FROM contracts c
       JOIN clients cl ON c.client_id = cl.id
       JOIN agencies a ON c.agency_id = a.id
       WHERE c.id = $1 AND c.agency_id = $2`,
      [id, session.user.agencyId]
    );

    // 3. If contract not found, return 404
    if (contractResult.rows.length === 0) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const contract = contractResult.rows[0];

    // 4. Call createSigningToken(contractId, client_email) → { token, code }
    const { token, code } = await createSigningToken(contract.id, contract.client_email);

    // 5. Build signingUrl
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const signingUrl = `${appUrl}/sign/contracts/${token}`;

    // 6. Call sendSigningRequestEmail with all required options
    await sendSigningRequestEmail({
      to: contract.client_email,
      clientName: contract.client_name,
      agencyName: contract.agency_name,
      contractFileName: contract.file_name,
      signingUrl,
    });

    // 7. Return success response with token
    return Response.json({
      success: true,
      message: 'Signing request sent',
      token,
    });
  } catch (error) {
    console.error('Error sending signing request:', error);
    return Response.json(
      { error: 'Failed to send signing request' },
      { status: 500 }
    );
  }
}
