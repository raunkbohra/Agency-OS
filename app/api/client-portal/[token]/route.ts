import { getClientByPortalToken, getDeliverablesByClient } from '@/lib/db-queries';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Get client by portal token (no session auth required)
    const client = await getClientByPortalToken(params.token);

    if (!client) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // Get deliverables for this client
    const deliverables = await getDeliverablesByClient(client.id);

    return Response.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company_name: client.company_name,
      },
      deliverables,
    });
  } catch (error) {
    console.error('Error fetching client portal data:', error);
    return Response.json(
      { error: 'Failed to fetch portal data' },
      { status: 500 }
    );
  }
}
