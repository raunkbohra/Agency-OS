import { NextRequest, NextResponse } from 'next/server';
import { submitSignature, getSigningTokenData } from '@/lib/db-queries';
import { sendSignatureConfirmationEmail, sendSignatureNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token, email, signatureImage, signerName } = await req.json();

    // Validate all required fields
    if (!token || !email || !signatureImage || !signerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get token data to verify it exists and retrieve contract info
    const tokenData = await getSigningTokenData(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Submit the signature - updates contract, creates signature record, marks token as signed
    const success = await submitSignature(token, email, signatureImage, signerName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to submit signature' },
        { status: 400 }
      );
    }

    // Both emails can be sent (signature submission succeeded)
    const now = new Date();
    const agencyName = process.env.NEXT_PUBLIC_APP_NAME || 'Agency OS';
    const agencyEmail = process.env.SMTP_FROM || 'noreply@agencyos.dev';

    // Send confirmation email to client and notification to agency
    // Using sequential sending to ensure proper error handling
    try {
      await sendSignatureConfirmationEmail({
        to: email,
        clientName: tokenData.client_name,
        agencyName,
        contractFileName: tokenData.file_name,
      });
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
      // Continue even if confirmation email fails, as signature was already submitted
    }

    try {
      await sendSignatureNotificationEmail({
        to: agencyEmail,
        agencyName,
        clientName: tokenData.client_name,
        contractFileName: tokenData.file_name,
        signedDate: now,
      });
    } catch (err) {
      console.error('Failed to send notification email:', err);
      // Continue even if notification email fails, as signature was already submitted
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Submit signature error:', err);
    return NextResponse.json(
      { error: 'Failed to submit signature' },
      { status: 500 }
    );
  }
}
