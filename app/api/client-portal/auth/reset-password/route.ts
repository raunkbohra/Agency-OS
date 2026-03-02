import { NextRequest, NextResponse } from 'next/server';
import { getClientPasswordResetToken, setClientPassword, consumeClientPasswordResetToken, getClientById } from '@/lib/db-queries';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate request has token and password (not empty)
    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Get reset token from database
    const resetTokenData = await getClientPasswordResetToken(token);

    if (!resetTokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const { clientId } = resetTokenData;

    // Verify client exists
    const client = await getClientById(clientId);

    if (!client) {
      console.error(`Client ${clientId} not found but reset token exists`);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update client password
    await setClientPassword(clientId, passwordHash);

    // Consume the reset token (mark as used)
    await consumeClientPasswordResetToken(token);

    return NextResponse.json(
      { success: true, message: 'Password updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
