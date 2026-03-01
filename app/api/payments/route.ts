import { createPayment, getInvoiceById, updateInvoiceStatus } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, amount, referenceId, provider, meta } = await req.json();

    if (!invoiceId || !referenceId) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId and referenceId' },
        { status: 400 }
      );
    }

    // Verify invoice belongs to agency and exists
    const invoice = await getInvoiceById(invoiceId, session.user.agencyId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Validate amount matches invoice or is provided
    const paymentAmount = amount || parseFloat(invoice.amount as string);
    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    // Create payment record
    const payment = await createPayment(invoiceId, session.user.agencyId, {
      amount: paymentAmount,
      provider: provider || 'bank_transfer',
      referenceId,
      meta,
    });

    // Update invoice status to pending verification
    await updateInvoiceStatus(invoiceId, session.user.agencyId, 'payment_pending');

    // TODO: Send email notification to agency owner for verification
    // TODO: Implement receipt storage (file upload handling)

    return NextResponse.json({
      success: true,
      payment,
      message: 'Payment submitted for verification',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment creation error:', message);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
