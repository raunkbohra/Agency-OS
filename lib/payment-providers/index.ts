import { PaymentProvider } from './provider';
import { BankTransferProvider } from './bank-transfer';
import { FonePayProvider } from './fonepay';
import { StripeProvider } from './stripe';
import { RazorpayProvider } from './razorpay';
import { EsewaProvider } from './esewa';

const providers: Record<string, PaymentProvider> = {
  bank_transfer: new BankTransferProvider(),
  fonepay: new FonePayProvider(),
  stripe: new StripeProvider(),
  razorpay: new RazorpayProvider(),
  esewa: new EsewaProvider(),
};

export function getProvider(providerId: string): PaymentProvider | null {
  return providers[providerId] || null;
}

export function getAllProviders(): PaymentProvider[] {
  return Object.values(providers);
}

export type { PaymentProvider, PaymentRequest, ParsedPaymentEvent } from './provider';
