// components/landing/pricing.tsx
'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SparkleButton } from '@/components/ui/sparkle-button';
import { BillingToggle } from '@/components/landing/billing-toggle';
import { usePricing } from '@/hooks/use-pricing';

interface PlanConfig {
  tier: 'free' | 'basic' | 'pro';
  name: string;
  description: string;
  features: string[];
  featured?: boolean;
}

const plans: PlanConfig[] = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Get started with the basics',
    features: ['3 clients', '5 plans', '1 team member', 'Basic invoicing'],
  },
  {
    tier: 'basic',
    name: 'Basic',
    description: 'For growing agencies',
    features: ['15 clients', '50 plans', '5 team members', 'Invoicing', 'Basic reporting'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    description: 'For agencies that scale',
    features: [
      'Unlimited clients',
      'Unlimited plans',
      'Unlimited team members',
      'Contracts',
      'Advanced reporting',
      'API access',
      'Priority support',
    ],
    featured: true,
  },
];

export function Pricing() {
  const { pricing, loading, billing, setBilling, prices, symbol } = usePricing();

  if (loading) {
    return (
      <section id="pricing" className="py-20 px-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Loading pricing...
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 px-6 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(107,126,147,0.06), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
              style={{
                background: 'var(--landing-badge-bg)',
                border: '1px solid var(--landing-badge-border)',
                color: 'var(--text-secondary)',
              }}
            >
              Pricing
            </div>
            <h2
              className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Start free. Upgrade when you&apos;re ready.
              {pricing && pricing.country !== 'Unknown' && (
                <span className="block text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Prices shown in {pricing.currency}
                </span>
              )}
            </p>
          </div>
        </ScrollReveal>

        {/* Billing toggle */}
        <BillingToggle billing={billing} onChange={setBilling} />

        {/* Plans Grid */}
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const tierPrices = prices[plan.tier];
            const price = billing === 'monthly' ? tierPrices.monthly : tierPrices.yearly;
            const isFree = plan.tier === 'free';

            return (
              <ScrollStaggerItem key={plan.tier}>
                <div
                  className="group relative h-full rounded-2xl p-6 flex flex-col transition-all duration-500 hover:-translate-y-2"
                  style={{
                    background: 'var(--landing-card-bg)',
                    border: plan.featured
                      ? '1px solid rgba(107, 126, 147, 0.4)'
                      : '1px solid var(--landing-card-border)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: plan.featured
                      ? '0 0 30px rgba(107, 126, 147, 0.1)'
                      : 'var(--shell-shadow)',
                  }}
                >
                  {/* Featured badge */}
                  {plan.featured && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{
                        background: 'rgba(107, 126, 147, 0.2)',
                        border: '1px solid rgba(107, 126, 147, 0.35)',
                        color: '#b0bec8',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Tier name + description */}
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-4xl font-black"
                        style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {isFree ? 'Free' : `${symbol}${price}`}
                      </span>
                      {!isFree && (
                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          /{billing === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className="h-px mb-6"
                    style={{ background: 'var(--landing-card-border)' }}
                  />

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#6b7e93' }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.featured ? (
                    <SparkleButton href={`/auth/signup?plan=${plan.tier}&region=${pricing?.region || 'global'}`}>
                      Get Started
                    </SparkleButton>
                  ) : (
                    <Link
                      href={isFree ? '/auth/signup' : `/auth/signup?plan=${plan.tier}&region=${pricing?.region || 'global'}`}
                      className="block text-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: 'var(--landing-badge-bg)',
                        border: '1px solid var(--landing-badge-border)',
                        color: 'var(--landing-secondary-btn-color)',
                      }}
                    >
                      {isFree ? 'Start Free' : 'Get Started'}
                    </Link>
                  )}

                  {/* Corner glow for featured */}
                  {plan.featured && (
                    <div
                      className="absolute bottom-0 right-0 w-40 h-40 rounded-2xl pointer-events-none opacity-30 group-hover:opacity-60 transition-all duration-500"
                      style={{
                        background: 'radial-gradient(circle at bottom right, rgba(107, 126, 147, 0.15), transparent)',
                        filter: 'blur(20px)',
                      }}
                    />
                  )}
                </div>
              </ScrollStaggerItem>
            );
          })}
        </ScrollStagger>

        {/* All plans include footer */}
        <ScrollReveal>
          <div className="mt-12 text-center">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              All plans include
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Client portals · Invoicing · Payment processing · Email support
            </p>
          </div>
        </ScrollReveal>

        {/* Link to full comparison */}
        <div className="mt-6 text-center">
          <Link
            href="/pricing"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: '#8fa0b0' }}
          >
            Compare all features →
          </Link>
        </div>
      </div>
    </section>
  );
}
