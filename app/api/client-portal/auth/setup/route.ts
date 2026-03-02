import { NextRequest, NextResponse } from 'next/server';
import { getClientByInviteToken, acceptClientInviteAndSetPassword } from '@/lib/db-queries';
import { hashPassword } from '@/lib/password';
import { createClientSession } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteToken, password } = body;

    // Validate request has both inviteToken and password (not empty)
    if (!inviteToken || typeof inviteToken !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: inviteToken and password are required' },
        { status: 400 }
      );
    }

    // Get client by invite token
    const client = await getClientByInviteToken(inviteToken);

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid or expired invite token' },
        { status: 400 }
      );
    }

    // Check if invite already accepted
    if (client.password_hash) {
      return NextResponse.json(
        { error: 'Invite already accepted' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Accept invite and set password (atomic operation)
    await acceptClientInviteAndSetPassword(client.id, passwordHash);

    // Create session
    const response = NextResponse.json({ success: true, clientId: client.id });
    await createClientSession(
      {
        id: client.id,
        agencyId: client.agency_id,
        email: client.email,
        name: client.name,
      },
      response
    );

    return response;
  } catch (error) {
    console.error('Error in auth setup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
