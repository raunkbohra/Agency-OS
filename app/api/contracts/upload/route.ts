import { auth } from '@/lib/auth';
import { uploadContract, getClientById } from '@/lib/db-queries';
import { sendSigningRequestEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const clientPlanId = formData.get('clientPlanId') as string;

    if (!file || !clientId || !clientPlanId) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // TODO: Upload to Vercel Blob
    // For now, generate a mock URL
    const fileUrl = `https://blob.vercel.com/${uuidv4()}`;

    const contract = await uploadContract({
      agencyId: session.user.agencyId,
      clientId,
      clientPlanId,
      fileName: file.name,
      fileUrl,
      fileSize: file.size
    });

    // Send signing request email asynchronously
    try {
      const client = await getClientById(clientId, session.user.agencyId);
      if (client?.email) {
        await sendSigningRequestEmail({
          to: client.email,
          clientName: client.name,
          contractFileName: file.name,
          signingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/sign/contracts/${contract.id}`,
          agencyName: session.user.agencyName || 'Agency OS'
        });
      }
    } catch (emailError) {
      console.error('Failed to send signing request email:', emailError);
      // Don't fail the upload if email fails
    }

    return Response.json(contract);
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to upload contract' }, { status: 500 });
  }
}
