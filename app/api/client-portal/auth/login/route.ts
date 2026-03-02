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
      // Skip clients without accepted invites or password set
      // Don't reveal whether account exists or is pending
      if (!client.invite_accepted || !client.password_hash) {
        continue;
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
      // Password didn't match this client, try next one
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
