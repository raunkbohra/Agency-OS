export interface PaymentRequest {
  qr?: string;
  link?: string;
  embedded?: string;
}

export interface ParsedPaymentEvent {
  invoiceId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  timestamp: Date;
}

export interface PaymentProvider {
  id: string;
  name: string;

  initialize(credentials: Record<string, string>): Promise<void>;
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;
  generatePaymentRequest(invoice: any): Promise<PaymentRequest>;
  verifyWebhook(payload: Record<string, any>, signature?: string): Promise<boolean>;
  parsePaymentEvent(payload: Record<string, any>): ParsedPaymentEvent;
}
