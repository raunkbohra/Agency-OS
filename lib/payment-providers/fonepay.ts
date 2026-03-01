import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';
import crypto from 'crypto';

export class FonePayProvider implements PaymentProvider {
  id = 'fonepay';
  name = 'FonePay';
  private apiKey: string = '';
  private merchantId: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.apiKey = credentials.apiKey;
    this.merchantId = credentials.merchantId;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    try {
      const response = await fetch('https://api.fonepay.com/validate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    const qrResponse = await fetch('https://api.fonepay.com/qr/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: this.merchantId,
        amount: invoice.amount,
        invoiceId: invoice.id,
      }),
    });

    const data = await qrResponse.json();
    return { qr: data.qrCode };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    if (!signature) return false;

    const secretKey = process.env.FONEPAY_WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      status: payload.status === 'success' ? 'completed' : 'failed',
      transactionId: payload.transactionId,
      timestamp: new Date(payload.timestamp),
    };
  }
}
