import { NextRequest, NextResponse } from 'next/server';
import { verifySigningCode } from '@/lib/db-queries';

export async function POST(req: NextRequest) {
  try {
    const { token, email, code } = await req.json();

    // Validate all required fields
    if (!token || !email || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call verifySigningCode - returns true if valid and updates verified=true in DB
    const isValid = await verifySigningCode(token, email, code);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('Verify code error:', err);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
