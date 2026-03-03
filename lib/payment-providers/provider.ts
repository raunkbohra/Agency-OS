// lib/payment-providers/provider.ts

export interface SubscriptionEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'invoice.paid' | 'invoice.payment_failed';
  agencyId: string;
  subscriptionId: string;
  planId?: string;
  status?: 'active' | 'past_due' | 'cancelled';
  amount?: number;
  currency?: string;
  nextBillingDate?: Date;
}

export interface PaymentLink {
  url: string;
  expiresAt?: Date;
}

export interface SubscriptionData {
  id: string;
  agencyId: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
}

export interface PaymentProvider {
  name: string;
  region: 'global' | 'india' | 'nepal';

  // Subscriptions
  createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }>;

  cancelSubscription(subscriptionId: string): Promise<void>;

  getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null>;

  // Client invoices
  createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink>;

  // Webhooks
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;

  parseWebhookEvent(payload: any): SubscriptionEvent | null;
}

export class PaymentProviderError extends Error {
  constructor(public provider: string, message: string) {
    super(`[${provider}] ${message}`);
  }
}
