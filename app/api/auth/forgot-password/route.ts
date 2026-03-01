import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { createResetToken } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    // Always return success to avoid user enumeration
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const token = createResetToken(email);
    const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3033'}/auth/reset-password?token=${token}`;

    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
