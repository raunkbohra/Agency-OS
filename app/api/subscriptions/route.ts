// app/api/subscriptions/route.ts

import { auth } from '@/lib/auth';
import { getAgencySubscription, createAgencySubscription, getSubscriptionPlanByTierAndRegion } from '@/lib/db-queries';
import { getPaymentProvider } from '@/lib/payment-providers/factory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await getAgencySubscription(session.user.agencyId!);
    return NextResponse.json(subscription || { tier: 'free' });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tier, billingPeriod, region } = await request.json();

    // Validate inputs
    if (!['basic', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 });
    }

    // Get subscription plan
    const plan = await getSubscriptionPlanByTierAndRegion(tier as 'basic' | 'pro', region, billingPeriod as 'monthly' | 'yearly');
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get payment provider for region
    const provider = getPaymentProvider(region);

    // Create subscription with provider
    if (!provider.createSubscription) {
      return NextResponse.json({ error: 'Provider does not support subscriptions' }, { status: 400 });
    }

    const { subscriptionId, redirectUrl } = await provider.createSubscription(
      session.user.agencyId,
      plan.id,
      {
        amount: plan.amount_cents,
        currency: plan.currency,
        billingPeriod: billingPeriod,
      }
    );

    // Save to database
    const subscription = await createAgencySubscription(
      session.user.agencyId,
      plan.id,
      region === 'india' ? 'razorpay' : region === 'nepal' ? 'fonepay' : 'stripe',
      subscriptionId
    );

    return NextResponse.json({
      subscription,
      redirectUrl,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
