// components/landing/pricing.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PricingData {
  country: string;
  region: 'global' | 'india' | 'nepal';
  currency: string;
}

interface Plan {
  tier: 'basic' | 'pro';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export function Pricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-20">Loading pricing...</div>;
  }

  if (!pricing) {
    return null;
  }

  const priceMap = {
    global: { basic: { monthly: 9, yearly: 86 }, pro: { monthly: 39, yearly: 374 } },
    india: { basic: { monthly: 199, yearly: 1910 }, pro: { monthly: 699, yearly: 6710 } },
    nepal: { basic: { monthly: 399, yearly: 3830 }, pro: { monthly: 1299, yearly: 12470 } },
  };

  const prices = priceMap[pricing.region];

  const plans: Plan[] = [
    {
      tier: 'basic',
      monthlyPrice: prices.basic.monthly,
      yearlyPrice: prices.basic.yearly,
      features: ['15 clients', '50 projects', '5 team members', 'Invoicing', 'Basic reporting'],
    },
    {
      tier: 'pro',
      monthlyPrice: prices.pro.monthly,
      yearlyPrice: prices.pro.yearly,
      features: ['Unlimited clients', 'Unlimited projects', 'Unlimited team members', 'Contracts', 'Advanced reporting', 'API access', 'Priority support'],
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center' }}>
          Pricing for {pricing.country}
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.125rem' }}>
          All prices in {pricing.currency}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className="rounded-xl p-8"
              style={{
                background: 'var(--landing-card-bg)',
                border: '1px solid var(--landing-card-border)',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600', textTransform: 'capitalize' }}>
                {plan.tier}
              </h3>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ color: 'var(--accent-blue)', fontSize: '2.25rem', fontWeight: 'bold' }}>
                  {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'Rs. '}
                  {plan.monthlyPrice}
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  /month or {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'Rs. '}
                  {plan.yearlyPrice}/year
                </div>
              </div>

              <ul style={{ marginBottom: '2rem' }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--accent-blue)' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/auth/signup?plan=${plan.tier}&region=${pricing.region}`}
                className="block w-full py-3 px-4 rounded-lg font-medium text-center transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'var(--accent-blue)',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                Get Started with {plan.tier === 'pro' ? 'Pro' : 'Basic'}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: '0.75rem', background: 'var(--landing-card-bg)', border: '1px solid var(--landing-card-border)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '500' }}>
            All plans include:
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Free tier for testing • Client portals • Invoicing • Payment processing • Email support
          </div>
        </div>
      </div>
    </section>
  );
}
