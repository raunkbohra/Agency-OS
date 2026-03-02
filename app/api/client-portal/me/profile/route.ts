import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/client-auth';
import { getClientById, updateClient } from '@/lib/db-queries';

export interface ClientProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  companyName?: string;
  address?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await getClientById(session.clientId, session.agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const response: ClientProfileResponse = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone || null,
      companyName: client.company_name || null,
      address: client.address || null,
    };

    return NextResponse.json({ client: response });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getClientSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateProfileRequest = await request.json();

    // Validate optional fields
    if (body.name !== undefined && typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Invalid name field' }, { status: 400 });
    }
    if (body.phone !== undefined && typeof body.phone !== 'string') {
      return NextResponse.json({ error: 'Invalid phone field' }, { status: 400 });
    }
    if (body.companyName !== undefined && typeof body.companyName !== 'string') {
      return NextResponse.json({ error: 'Invalid companyName field' }, { status: 400 });
    }
    if (body.address !== undefined && typeof body.address !== 'string') {
      return NextResponse.json({ error: 'Invalid address field' }, { status: 400 });
    }

    // Update client
    const updatedClient = await updateClient(
      session.clientId,
      session.agencyId,
      body.name,
      undefined, // email cannot be updated via this endpoint
      body.phone,
      body.companyName,
      body.address
    );

    if (!updatedClient) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    const response = {
      success: true,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone || null,
        companyName: updatedClient.company_name || null,
        address: updatedClient.address || null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating client profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
