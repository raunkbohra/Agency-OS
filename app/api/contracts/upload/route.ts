import { auth } from '@/lib/auth';
import { uploadContract, getClientById, createSigningToken } from '@/lib/db-queries';
import { sendSigningRequestEmail } from '@/lib/email';
import { uploadFileToR2 } from '@/lib/r2-upload';

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

    // Upload file to R2 bucket
    const fileUrl = await uploadFileToR2(file, 'contracts');

    const contract = await uploadContract({
      agencyId: session.user.agencyId,
      clientId,
      clientPlanId,
      fileName: file.name,
      fileUrl,
      fileSize: file.size
    });

    // Create signing token and send request email asynchronously
    try {
      const client = await getClientById(clientId, session.user.agencyId);
      if (client?.email) {
        // Create a signing token for this contract
        const signingToken = await createSigningToken(contract.id, client.email);

        await sendSigningRequestEmail({
          to: client.email,
          clientName: client.name,
          contractFileName: file.name,
          signingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/sign/contracts/${signingToken}`,
          agencyName: 'Agency OS'
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
