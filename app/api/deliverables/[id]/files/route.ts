import { auth } from '@/lib/auth';
import { addDeliverableFile, getDeliverableById } from '@/lib/db-queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return Response.json({ message: 'Files endpoint is working' });
}

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

    // Handle JSON body (URL input)
    if (contentType?.includes('application/json')) {
      let body: any;
      try {
        body = await request.json();
      } catch (parseErr) {
        return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }

      const { fileUrl, fileName } = body;

      if (!fileUrl || !fileName) {
        return Response.json({ error: 'fileUrl and fileName required' }, { status: 400 });
      }

      let deliverable: any;
      try {
        // Verify deliverable exists and user has access
        deliverable = await getDeliverableById(id, session.user.agencyId);
      } catch (dbErr) {
        console.error('Database error in getDeliverableById:', dbErr);
        return Response.json({ error: 'Database error', details: String(dbErr) }, { status: 500 });
      }

      if (!deliverable) {
        return Response.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      let result: any;
      try {
        result = await addDeliverableFile({
          deliverableId: id,
          fileName,
          fileUrl,
          uploadedBy: session.user.id,
        });
      } catch (insertErr) {
        console.error('Database error in addDeliverableFile:', insertErr);
        return Response.json({ error: 'Database error adding file', details: String(insertErr) }, { status: 500 });
      }

      return Response.json(result);
    }

    // Handle FormData (file upload)
    if (contentType?.includes('multipart/form-data')) {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (formErr) {
        return Response.json({ error: 'Invalid form data' }, { status: 400 });
      }

      const file = formData.get('file') as File;
      const fileName = formData.get('fileName') as string;

      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400 });
      }

      let deliverable: any;
      try {
        deliverable = await getDeliverableById(id, session.user.agencyId);
      } catch (dbErr) {
        console.error('Database error in getDeliverableById:', dbErr);
        return Response.json({ error: 'Database error', details: String(dbErr) }, { status: 500 });
      }

      if (!deliverable) {
        return Response.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      const fileUrl = `/api/files/${id}/${Date.now()}-${file.name}`;

      let result: any;
      try {
        result = await addDeliverableFile({
          deliverableId: id,
          fileName: fileName || file.name,
          fileUrl,
          uploadedBy: session.user.id,
        });
      } catch (insertErr) {
        console.error('Database error in addDeliverableFile:', insertErr);
        return Response.json({ error: 'Database error adding file', details: String(insertErr) }, { status: 500 });
      }

      return Response.json(result);
    }

    return Response.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (error) {
    console.error('Unhandled error in POST:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}
