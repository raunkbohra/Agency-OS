// lib/payment-providers/razorpay.ts

import { PaymentProvider, SubscriptionEvent, PaymentLink, SubscriptionData, PaymentProviderError } from './provider';

export class RazorpayProvider implements PaymentProvider {
  name = 'Razorpay';
  region: 'global' | 'india' | 'nepal' = 'india';

  constructor(keyId: string, keySecret: string) {
    // Store keys if needed
  }

  async createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }> {
    try {
      return {
        subscriptionId: `rzp_sub_${Date.now()}`,
      };
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to create subscription: ${String(error)}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      return;
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to cancel subscription: ${String(error)}`);
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null> {
    return null;
  }

  async createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink> {
    try {
      return {
        url: `https://rzp.io/l/test/${invoice.id}`,
      };
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to create payment link: ${String(error)}`);
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: any): SubscriptionEvent | null {
    const event = payload.event;
    const data = payload.payload?.subscription?.entity;

    switch (event) {
      case 'subscription.authenticated':
        return {
          type: 'subscription.created',
          agencyId: data?.notes?.agencyId || '',
          subscriptionId: data?.id || '',
          status: 'active',
        };
      case 'invoice.paid':
        return {
          type: 'invoice.paid',
          agencyId: data?.notes?.agencyId || '',
          subscriptionId: data?.subscription_id || '',
        };
      default:
        return null;
    }
  }
}
