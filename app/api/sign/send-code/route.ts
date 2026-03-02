import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCodeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify token exists and email matches
    const result = await db.query(
      `SELECT id, verification_code FROM contract_signing_tokens
       WHERE token = $1 AND email = $2`,
      [token, email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token or email' },
        { status: 400 }
      );
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code in the database
    await db.query(
      `UPDATE contract_signing_tokens
       SET verification_code = $1, code_expires_at = $2
       WHERE token = $3`,
      [verificationCode, codeExpiresAt, token]
    );

    // Send email with code
    await sendVerificationCodeEmail({
      to: email,
      code: verificationCode,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
