import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class EsewaProvider implements PaymentProvider {
  id = 'esewa';
  name = 'Esewa';
  private merchantCode: string = '';
  private secret: string = '';

  async initialize(credentials: Record<string, string>): Promise<void> {
    this.merchantCode = credentials.merchantCode;
    this.secret = credentials.secret;
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    return !!(credentials.merchantCode && credentials.secret);
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    const link = `https://esewa.com.np/epay/main?amt=${invoice.amount}&psc=0&pid=${invoice.id}&scd=${this.merchantCode}`;
    return { link };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    return true;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.pid || '',
      amount: payload.amt || 0,
      status: payload.status === 'success' ? 'completed' : 'failed',
      transactionId: payload.oid || '',
      timestamp: new Date(),
    };
  }
}
