// hooks/use-pricing.ts
'use client';

import { useState, useEffect } from 'react';

export interface PricingData {
  country: string;
  region: 'global' | 'india' | 'nepal';
  currency: string;
}

export type BillingPeriod = 'monthly' | 'yearly';

export interface TierPrices {
  free: { monthly: number; yearly: number };
  basic: { monthly: number; yearly: number };
  pro: { monthly: number; yearly: number };
}

const priceMap: Record<PricingData['region'], TierPrices> = {
  global: {
    free: { monthly: 0, yearly: 0 },
    basic: { monthly: 9, yearly: 86 },
    pro: { monthly: 39, yearly: 374 },
  },
  india: {
    free: { monthly: 0, yearly: 0 },
    basic: { monthly: 199, yearly: 1910 },
    pro: { monthly: 699, yearly: 6710 },
  },
  nepal: {
    free: { monthly: 0, yearly: 0 },
    basic: { monthly: 399, yearly: 3830 },
    pro: { monthly: 1299, yearly: 12470 },
  },
};

export function formatCurrency(currency: string): string {
  if (currency === 'USD') return '$';
  if (currency === 'INR') return '₹';
  return 'NRs. ';
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  useEffect(() => {
    async function fetchLocation() {
      try {
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          setPricing(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await fetch('/api/user-location');
        const data = await response.json();
        setPricing(data);
        localStorage.setItem('userLocation', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to detect location:', error);
        setPricing({ country: 'Unknown', region: 'global', currency: 'USD' });
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, []);

  const prices = pricing ? priceMap[pricing.region] : priceMap.global;
  const symbol = pricing ? formatCurrency(pricing.currency) : '$';

  return { pricing, loading, billing, setBilling, prices, symbol };
}
