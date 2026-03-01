import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class RazorpayProvider implements PaymentProvider {
  id = 'razorpay';
  name = 'Razorpay';
  private keyId: string = '';
  private keySecret: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.keyId = credentials.keyId;
    this.keySecret = credentials.keySecret;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/invoices', {
        headers: { 'Authorization': `Basic ${auth}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/qr_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        upi_link: 'upi://pay?pa=merchant@razorpay&pn=Invoice',
        amount: String(Math.round(invoice.amount * 100)),
      }),
    });

    const data = await response.json();
    return { qr: data.image_url };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    const crypto = require('crypto');
    const secretKey = this.keySecret;
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.notes?.invoiceId || '',
      amount: payload.amount / 100,
      status: payload.status === 'issued' ? 'completed' : 'pending',
      transactionId: payload.id,
      timestamp: new Date(payload.created_at * 1000),
    };
  }
}
