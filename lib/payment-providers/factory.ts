// lib/payment-providers/factory.ts

import { PaymentProvider } from './provider';
import { StripeProvider } from './stripe';
import { RazorpayProvider } from './razorpay';
import { FonepayProvider } from './fonepay';

export type Region = 'global' | 'india' | 'nepal';

export function getPaymentProvider(region: Region): PaymentProvider {
  switch (region) {
    case 'global':
      return new StripeProvider(process.env.STRIPE_SECRET_KEY || '');

    case 'india':
      return new RazorpayProvider(
        process.env.RAZORPAY_KEY_ID || '',
        process.env.RAZORPAY_KEY_SECRET || ''
      );

    case 'nepal':
      return new FonepayProvider();

    default:
      throw new Error(`Unknown region: ${region}`);
  }
}

export function getProviderNameByRegion(region: Region): string {
  const provider = getPaymentProvider(region);
  return provider.name;
}
