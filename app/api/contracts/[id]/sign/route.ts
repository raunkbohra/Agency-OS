import { auth } from '@/lib/auth';
import { signContract, getContractById } from '@/lib/db-queries';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { signerName, clientId, agencyId } = await request.json();
    const { id } = await params;

    // Get client token from somewhere (or use clientId directly for now)
    const contract = await getContractById(id, agencyId);

    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    const signed = await signContract(id, agencyId, {
      signerName,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return Response.json(signed);
  } catch (error) {
    console.error('Sign error:', error);
    return Response.json({ error: 'Failed to sign contract' }, { status: 500 });
  }
}
