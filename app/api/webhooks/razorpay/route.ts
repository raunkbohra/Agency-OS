// app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RazorpayProvider } from '@/lib/payment-providers/razorpay';
import { updateSubscriptionStatus, recordSubscriptionChange, getAgencySubscription } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.arrayBuffer();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const provider = new RazorpayProvider(
      process.env.RAZORPAY_KEY_ID || '',
      process.env.RAZORPAY_KEY_SECRET || ''
    );

    // Verify signature
    if (!provider.verifyWebhookSignature(Buffer.from(payload), signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(Buffer.from(payload).toString());
    const event = provider.parseWebhookEvent(body);

    if (!event) {
      return NextResponse.json({ received: true });
    }

    // Handle event
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await updateSubscriptionStatus(event.agencyId, event.status || 'active');
        break;

      case 'subscription.cancelled':
        await updateSubscriptionStatus(event.agencyId, 'cancelled');
        const sub = await getAgencySubscription(event.agencyId);
        if (sub) {
          await recordSubscriptionChange(event.agencyId, sub.tier, 'free', 'cancellation');
        }
        break;

      case 'invoice.paid':
        await updateSubscriptionStatus(event.agencyId, 'active');
        break;

      case 'invoice.payment_failed':
        await updateSubscriptionStatus(event.agencyId, 'past_due');
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
