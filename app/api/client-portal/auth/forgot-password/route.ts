import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getClientsByEmailAny, createClientPasswordResetToken } from '@/lib/db-queries';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email is present and not empty
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: true, message: 'If an account exists with that email, a reset link has been sent' },
        { status: 200 }
      );
    }

    // Query clients by email (any agency)
    const clients = await getClientsByEmailAny(email);

    // If no matching client, return success anyway (don't reveal if email exists)
    if (clients.length === 0) {
      return NextResponse.json(
        { success: true, message: 'If an account exists with that email, a reset link has been sent' },
        { status: 200 }
      );
    }

    const client = clients[0]; // Use first matching client

    // Generate reset token
    const token = randomBytes(32).toString('hex');

    // Calculate expiry: 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Create reset token in database
    await createClientPasswordResetToken(client.id, token, expiresAt);

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/client-portal/reset-password?token=${token}`;

    // Send password reset email
    await sendPasswordResetEmail(client.email, resetUrl);

    return NextResponse.json(
      { success: true, message: 'If an account exists with that email, a reset link has been sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot-password:', error);
    // Don't expose errors to avoid information leakage
    return NextResponse.json(
      { success: true, message: 'If an account exists with that email, a reset link has been sent' },
      { status: 200 }
    );
  }
}
