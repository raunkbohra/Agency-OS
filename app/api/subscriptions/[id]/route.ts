// app/api/subscriptions/[id]/route.ts

import { auth } from '@/lib/auth';
import { getAgencySubscription, updateSubscriptionStatus, recordSubscriptionChange } from '@/lib/db-queries';
import { getPaymentProvider } from '@/lib/payment-providers/factory';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const subscription = await getAgencySubscription(session.user.agencyId);
    if (!subscription || subscription.id !== id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Get provider and cancel
    const provider = getPaymentProvider(subscription.region);
    const subscriptionId = subscription.stripe_subscription_id ||
                          subscription.razorpay_subscription_id ||
                          subscription.fonepay_order_id;

    if (subscriptionId) {
      await provider.cancelSubscription(subscriptionId);
    }

    // Update status
    await updateSubscriptionStatus(session.user.agencyId, 'cancelled');
    await recordSubscriptionChange(session.user.agencyId, subscription.tier, 'free', 'cancellation');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
