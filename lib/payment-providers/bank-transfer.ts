import { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';

export class BankTransferProvider implements PaymentProvider {
  id = 'bank_transfer';
  name = 'Bank Transfer';

  async initialize(credentials: Record<string, string>): Promise<void> {
    // No external API for bank transfer
  }

  async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    return true;
  }

  async generatePaymentRequest(invoice: any): Promise<PaymentRequest> {
    return { link: `/dashboard/invoices/${invoice.id}/pay?method=bank_transfer` };
  }

  async verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean> {
    return true;
  }

  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent {
    return {
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      status: 'completed',
      transactionId: payload.transactionId,
      timestamp: new Date(),
    };
  }
}
