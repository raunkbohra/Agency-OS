// components/landing/pricing-table.tsx
'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SparkleButton } from '@/components/ui/sparkle-button';
import { BillingToggle } from '@/components/landing/billing-toggle';
import { usePricing } from '@/hooks/use-pricing';

type TierKey = 'free' | 'basic' | 'pro';

interface FeatureRow {
  name: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
}

interface FeatureGroup {
  label: string;
  features: FeatureRow[];
}

const featureGroups: FeatureGroup[] = [
  {
    label: 'Limits',
    features: [
      { name: 'Clients', free: '3', basic: '15', pro: 'Unlimited' },
      { name: 'Plans', free: '5', basic: '50', pro: 'Unlimited' },
      { name: 'Team members', free: '1', basic: '5', pro: 'Unlimited' },
    ],
  },
  {
    label: 'Core Features',
    features: [
      { name: 'Client portals', free: true, basic: true, pro: true },
      { name: 'Invoicing', free: true, basic: true, pro: true },
      { name: 'Payment processing', free: true, basic: true, pro: true },
      { name: 'Deliverables tracking', free: true, basic: true, pro: true },
      { name: 'Contracts', free: false, basic: false, pro: true },
    ],
  },
  {
    label: 'Reporting & Integrations',
    features: [
      { name: 'Basic reporting', free: false, basic: true, pro: true },
      { name: 'Advanced reporting', free: false, basic: false, pro: true },
      { name: 'API access', free: false, basic: false, pro: true },
    ],
  },
  {
    label: 'Support',
    features: [
      { name: 'Email support', free: true, basic: true, pro: true },
      { name: 'Priority support', free: false, basic: false, pro: true },
    ],
  },
];

const tierNames: Record<TierKey, string> = { free: 'Free', basic: 'Basic', pro: 'Pro' };
const tiers: TierKey[] = ['free', 'basic', 'pro'];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>;
  }
  if (value) {
    return <Check size={16} style={{ color: '#6b7e93' }} />;
  }
  return <X size={16} style={{ color: 'var(--text-quaternary)' }} />;
}

// Mobile: card-per-tier view
function MobileCards() {
  const { pricing, loading, billing, setBilling, prices, symbol } = usePricing();

  if (loading) return null;

  return (
    <div className="md:hidden space-y-6">
      <BillingToggle billing={billing} onChange={setBilling} />

      {tiers.map((tier) => {
        const tierPrices = prices[tier];
        const price = billing === 'monthly' ? tierPrices.monthly : tierPrices.yearly;
        const isFree = tier === 'free';

        return (
          <ScrollReveal key={tier}>
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--landing-card-bg)',
                border: tier === 'pro'
                  ? '1px solid rgba(107, 126, 147, 0.4)'
                  : '1px solid var(--landing-card-border)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {tierNames[tier]}
              </h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span
                  className="text-3xl font-black"
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

              {featureGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    {group.label}
                  </p>
                  <ul className="space-y-2">
                    {group.features.map((feature) => {
                      const val = feature[tier];
                      if (val === false) return null;
                      return (
                        <li key={feature.name} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <Check size={14} style={{ color: '#6b7e93' }} className="flex-shrink-0" />
                          <span>{feature.name}{typeof val === 'string' ? `: ${val}` : ''}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {tier === 'pro' ? (
                <SparkleButton href={`/auth/signup?plan=${tier}&region=${pricing?.region || 'global'}`}>
                  Get Started
                </SparkleButton>
              ) : (
                <Link
                  href={isFree ? '/auth/signup' : `/auth/signup?plan=${tier}&region=${pricing?.region || 'global'}`}
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
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}

// Desktop: full comparison table
function DesktopTable() {
  const { pricing, loading, billing, setBilling, prices, symbol } = usePricing();

  if (loading) return null;

  return (
    <div className="hidden md:block">
      <BillingToggle billing={billing} onChange={setBilling} />

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--landing-card-bg)',
          border: '1px solid var(--landing-card-border)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Sticky header with tier names + prices + CTAs */}
        <div
          className="sticky top-16 z-20 grid grid-cols-4 gap-0"
          style={{
            background: 'var(--landing-card-bg)',
            borderBottom: '1px solid var(--landing-card-border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Empty first cell */}
          <div className="p-6" />

          {tiers.map((tier) => {
            const tierPrices = prices[tier];
            const price = billing === 'monthly' ? tierPrices.monthly : tierPrices.yearly;
            const isFree = tier === 'free';

            return (
              <div
                key={tier}
                className="p-6 text-center"
                style={{
                  borderLeft: '1px solid var(--landing-card-border)',
                  background: tier === 'pro' ? 'rgba(107, 126, 147, 0.05)' : 'transparent',
                }}
              >
                {tier === 'pro' && (
                  <span
                    className="inline-block text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2"
                    style={{
                      background: 'rgba(107, 126, 147, 0.2)',
                      border: '1px solid rgba(107, 126, 147, 0.3)',
                      color: '#b0bec8',
                    }}
                  >
                    Most Popular
                  </span>
                )}
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {tierNames[tier]}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span
                    className="text-3xl font-black"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {isFree ? 'Free' : `${symbol}${price}`}
                  </span>
                  {!isFree && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      /{billing === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  )}
                </div>
                {tier === 'pro' ? (
                  <SparkleButton href={`/auth/signup?plan=${tier}&region=${pricing?.region || 'global'}`}>
                    Get Started
                  </SparkleButton>
                ) : (
                  <Link
                    href={isFree ? '/auth/signup' : `/auth/signup?plan=${tier}&region=${pricing?.region || 'global'}`}
                    className="inline-block px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'var(--landing-badge-bg)',
                      border: '1px solid var(--landing-badge-border)',
                      color: 'var(--landing-secondary-btn-color)',
                    }}
                  >
                    {isFree ? 'Start Free' : 'Get Started'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature groups */}
        {featureGroups.map((group) => (
          <div key={group.label}>
            {/* Group header */}
            <div
              className="grid grid-cols-4 gap-0"
              style={{ background: 'rgba(107, 126, 147, 0.04)' }}
            >
              <div className="p-4 col-span-4">
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {group.label}
                </span>
              </div>
            </div>

            {/* Feature rows */}
            {group.features.map((feature, idx) => (
              <div
                key={feature.name}
                className="grid grid-cols-4 gap-0 items-center"
                style={{
                  borderBottom: '1px solid var(--landing-card-border)',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <div className="p-4">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {feature.name}
                  </span>
                </div>
                {tiers.map((tier) => (
                  <div
                    key={tier}
                    className="p-4 flex justify-center"
                    style={{
                      borderLeft: '1px solid var(--landing-card-border)',
                      background: tier === 'pro' ? 'rgba(107, 126, 147, 0.03)' : 'transparent',
                    }}
                  >
                    <CellValue value={feature[tier]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PricingTable() {
  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
}
