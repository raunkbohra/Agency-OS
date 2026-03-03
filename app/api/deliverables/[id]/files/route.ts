import { auth } from '@/lib/auth';
import { addDeliverableFile, getDeliverableById } from '@/lib/db-queries';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type');

    // Log session data for debugging
    console.log('Session user ID:', session.user.id);
    console.log('Session user agencyId:', session.user.agencyId);
    console.log('Deliverable ID:', id);

    // Handle JSON body (URL input)
    if (contentType?.includes('application/json')) {
      console.log('Processing JSON request for file upload');
      const body = await request.json();
      const { fileUrl, fileName } = body;

      if (!fileUrl || !fileName) {
        return Response.json({ error: 'fileUrl and fileName required' }, { status: 400 });
      }

      console.log('Validating deliverable access');
      // Verify deliverable exists and user has access
      const deliverable = await getDeliverableById(id, session.user.agencyId);
      if (!deliverable) {
        console.log('Deliverable not found or no access');
        return Response.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      console.log('Adding file to deliverable');
      const result = await addDeliverableFile({
        deliverableId: id,
        fileName,
        fileUrl,
        uploadedBy: session.user.id,
      });

      console.log('File added successfully');
      return Response.json(result);
    }

    // Handle FormData (file upload)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string;

      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }

      // Verify deliverable exists and user has access
      const deliverable = await getDeliverableById(id, session.user.agencyId);
      if (!deliverable) {
        return Response.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      // For now, store file URL as-is (in production, upload to S3/cloud storage)
      // This is a placeholder for cloud storage integration
      const fileUrl = `/api/files/${id}/${Date.now()}-${file.name}`;

      const result = await addDeliverableFile({
        deliverableId: id,
        fileName: fileName || file.name,
        fileUrl,
        uploadedBy: session.user.id,
      });

      return Response.json(result);
    }

    return Response.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (error) {
    console.error('Error adding file:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'Failed to add file', details: errorMessage }, { status: 500 });
  }
}
