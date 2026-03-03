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

export interface PaymentRequest {
  link: string;
}

export interface ParsedPaymentEvent {
  invoiceId: string;
  amount: number;
  status: string;
  transactionId: string;
  timestamp: Date;
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
  id?: string;
  region?: 'global' | 'india' | 'nepal';

  // Subscriptions (optional - for subscription-based providers)
  createSubscription?(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }>;

  cancelSubscription?(subscriptionId: string): Promise<void>;

  getSubscriptionStatus?(subscriptionId: string): Promise<SubscriptionData | null>;

  // Client invoices / Payment Requests
  createPaymentLink?(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink>;

  generatePaymentRequest?(invoice: any): Promise<PaymentRequest>;

  // Webhooks / Credentials
  verifyWebhookSignature?(payload: Buffer, signature: string): boolean;

  parseWebhookEvent?(payload: any): SubscriptionEvent | null;

  verifyWebhook?(payload: Record<string, any>, signature?: string): Promise<boolean>;

  parsePaymentEvent?(payload: Record<string, any>): ParsedPaymentEvent;

  initialize?(credentials: Record<string, string>): Promise<void>;

  validateCredentials?(credentials: Record<string, string>): Promise<boolean>;
}

export class PaymentProviderError extends Error {
  constructor(public provider: string, message: string) {
    super(`[${provider}] ${message}`);
  }
}
