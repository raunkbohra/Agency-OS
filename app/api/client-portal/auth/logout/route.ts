import { NextRequest, NextResponse } from 'next/server';
import { clearClientSession } from '@/lib/client-auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    clearClientSession(response);
    return response;
  } catch (error) {
    console.error('Error in auth logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
