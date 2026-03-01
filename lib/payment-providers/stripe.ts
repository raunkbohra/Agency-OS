import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class StripeProvider implements PaymentProvider {
  id = 'stripe';
  name = 'Stripe';
  private apiKey: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.apiKey = credentials.apiKey;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    const response = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': 'npr',
        'line_items[0][price_data][unit_amount]': String(Math.round(invoice.amount * 100)),
        'line_items[0][quantity]': '1',
      }),
    });

    const data = await response.json();
    return { link: data.url };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    const crypto = require('crypto');
    const secretKey = process.env.STRIPE_WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.metadata?.invoiceId || '',
      amount: payload.amount_total / 100,
      status: payload.payment_status === 'paid' ? 'completed' : 'pending',
      transactionId: payload.id,
      timestamp: new Date(payload.created * 1000),
    };
  }
}
