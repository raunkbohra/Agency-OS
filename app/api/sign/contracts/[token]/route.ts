import { NextRequest, NextResponse } from 'next/server';
import { getSigningTokenData } from '@/lib/db-queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Extract token from params
    const { token } = await params;

    // Validate token exists
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Get token data
    const data = await getSigningTokenData(token);

    // If data is null, token not found or expired
    if (data === null) {
      return NextResponse.json(
        { error: 'Signing link not found or expired' },
        { status: 404 }
      );
    }

    // Check if already signed
    if (data.signed === true) {
      return NextResponse.json(
        { error: 'This contract has already been signed' },
        { status: 400 }
      );
    }

    // Return success response
    return NextResponse.json({
      contractId: data.contract_id,
      fileName: data.file_name,
      fileUrl: data.file_url,
      clientName: data.client_name,
      email: data.email,
      verified: data.verified,
    });
  } catch (error) {
    console.error('Get signing data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract details' },
      { status: 500 }
    );
  }
}
