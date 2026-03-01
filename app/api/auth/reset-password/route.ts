import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyResetToken, hashPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const email = verifyResetToken(token);
    if (!email) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
    }

    const pool = getPool();
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [passwordHash, email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
