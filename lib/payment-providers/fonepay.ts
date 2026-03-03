// lib/payment-providers/fonepay.ts

import { PaymentProvider, SubscriptionEvent, PaymentLink, SubscriptionData, PaymentProviderError } from './provider';

export class FonepayProvider implements PaymentProvider {
  name = 'Fonepay';
  region: 'global' | 'india' | 'nepal' = 'nepal';

  constructor() {
    // Fonepay doesn't have direct API yet
  }

  async createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }> {
    const subscriptionId = `FONEPAY-${agencyId}-${Date.now()}`;
    return { subscriptionId };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    return;
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
    return {
      url: `fonepay://pay?amount=${invoice.amount}&reference=${invoice.id}`,
    };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    return false;
  }

  parseWebhookEvent(payload: any): SubscriptionEvent | null {
    return null;
  }
}
