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

    // Test: Return success immediately
    return Response.json({ success: true, message: 'File would be added here', id });
  } catch (error) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: 'Failed', details: errorMessage }, { status: 500 });
  }
}
