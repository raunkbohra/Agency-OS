import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { hashPassword, generateIdFromEmail } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, agencyName } = await req.json();

    if (!name || !email || !password || !agencyName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const pool = getPool();
    const userId = generateIdFromEmail(email);

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Create agency first
    const agencyResult = await pool.query(
      'INSERT INTO agencies (name, owner_id, currency) VALUES ($1, $2, $3) RETURNING id',
      [agencyName, userId, 'USD']
    );
    const agencyId = agencyResult.rows[0].id;

    // Create user
    await pool.query(
      'INSERT INTO users (id, agency_id, email, name, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, agencyId, email, name, 'owner', passwordHash]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
