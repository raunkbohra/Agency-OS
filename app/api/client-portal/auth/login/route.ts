import { NextRequest, NextResponse } from 'next/server';
import { getClientsByEmailAny } from '@/lib/db-queries';
import { verifyPassword } from '@/lib/password';
import { createClientSession } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate request has email and password (not empty)
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Query clients by email (any agency)
    const clients = await getClientsByEmailAny(email);

    // Try to find a matching client with valid password
    for (const client of clients) {
      // Check if invite not accepted
      if (!client.invite_accepted) {
        return NextResponse.json(
          { error: 'Please accept your invitation first' },
          { status: 400 }
        );
      }

      // Check if password_hash exists
      if (!client.password_hash) {
        return NextResponse.json(
          { error: 'Please accept your invitation first' },
          { status: 400 }
        );
      }

      // Verify password
      const isPasswordValid = await verifyPassword(client.password_hash, password);
      if (isPasswordValid) {
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
      }
    }

    // No matching client or password doesn't match any
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in auth login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
