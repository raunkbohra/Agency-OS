# Pricing Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the inconsistent pricing section with a three-card layout on the homepage and a comparison table on `/pricing`, both using the site's established design system.

**Architecture:** Extract shared pricing logic (location detection, price maps, currency) into a `usePricing` hook. Build a shared `BillingToggle` component. Rewrite `pricing.tsx` as a three-card (Free/Basic/Pro) component with ScrollStagger animations. Create new `pricing-table.tsx` as a responsive comparison table with sticky headers and mobile card fallback.

**Tech Stack:** Next.js, React, Framer Motion (`ScrollStagger`, `ScrollReveal`), Tailwind CSS + CSS variables, `SparkleButton` component.

---

### Task 1: Create `usePricing` hook

**Files:**
- Create: `hooks/use-pricing.ts`

**Step 1: Create the hook file**

```ts
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
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep use-pricing || echo "No errors"`
Expected: No errors

**Step 3: Commit**

```bash
git add hooks/use-pricing.ts
git commit -m "feat: extract usePricing hook for shared pricing logic"
```

---

### Task 2: Create `BillingToggle` component

**Files:**
- Create: `components/landing/billing-toggle.tsx`

**Step 1: Create the toggle component**

This is a pill-shaped toggle with monthly/yearly options and a "Save ~20%" badge. Uses the site's CSS variables and steel-blue palette.

```tsx
// components/landing/billing-toggle.tsx
'use client';

import type { BillingPeriod } from '@/hooks/use-pricing';

interface BillingToggleProps {
  billing: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}

export function BillingToggle({ billing, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <div
        className="relative inline-flex items-center rounded-full p-1"
        style={{
          background: 'var(--landing-card-bg)',
          border: '1px solid var(--landing-card-border)',
        }}
      >
        <button
          onClick={() => onChange('monthly')}
          className="relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-all duration-300"
          style={{
            background: billing === 'monthly' ? 'rgba(107, 126, 147, 0.2)' : 'transparent',
            color: billing === 'monthly' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: billing === 'monthly' ? '1px solid rgba(107, 126, 147, 0.3)' : '1px solid transparent',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('yearly')}
          className="relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-all duration-300"
          style={{
            background: billing === 'yearly' ? 'rgba(107, 126, 147, 0.2)' : 'transparent',
            color: billing === 'yearly' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: billing === 'yearly' ? '1px solid rgba(107, 126, 147, 0.3)' : '1px solid transparent',
          }}
        >
          Yearly
        </button>
      </div>
      {billing === 'yearly' && (
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(107, 126, 147, 0.15)',
            color: '#8fa0b0',
            border: '1px solid rgba(107, 126, 147, 0.25)',
          }}
        >
          Save ~20%
        </span>
      )}
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep billing-toggle || echo "No errors"`
Expected: No errors

**Step 3: Commit**

```bash
git add components/landing/billing-toggle.tsx
git commit -m "feat: add BillingToggle component for monthly/yearly switch"
```

---

### Task 3: Rewrite homepage `Pricing` component (three-card)

**Files:**
- Modify: `components/landing/pricing.tsx` (full rewrite)

**Step 1: Rewrite the pricing component**

Complete rewrite using the site's design system: Plus Jakarta Sans, steel-blue palette, ScrollStagger, SparkleButton, CSS variables.

```tsx
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
```

**Step 2: Verify dev server loads without errors**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: 200

**Step 3: Commit**

```bash
git add components/landing/pricing.tsx
git commit -m "feat: rewrite homepage pricing as three-card layout with design system"
```

---

### Task 4: Create `/pricing` comparison table component

**Files:**
- Create: `components/landing/pricing-table.tsx`

**Step 1: Create the comparison table component**

Full-width responsive comparison table with sticky headers, feature groups, and mobile card fallback.

```tsx
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
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | grep pricing-table || echo "No errors"`
Expected: No errors

**Step 3: Commit**

```bash
git add components/landing/pricing-table.tsx
git commit -m "feat: add PricingTable comparison component for /pricing page"
```

---

### Task 5: Update `/pricing` page to use comparison table

**Files:**
- Modify: `app/(marketing)/pricing/page.tsx`

**Step 1: Update the pricing page**

Replace the current import of `Pricing` with a page that has its own header and uses `PricingTable`.

```tsx
// app/(marketing)/pricing/page.tsx
import { PricingTable } from '@/components/landing/pricing-table';

export const metadata = {
  title: 'Pricing | Agency OS',
  description: 'Compare pricing plans for agencies of all sizes. Free, Basic, and Pro tiers with detailed feature comparison.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{
              background: 'var(--landing-badge-bg)',
              border: '1px solid var(--landing-badge-border)',
              color: 'var(--text-secondary)',
            }}
          >
            Plans & Pricing
          </div>
          <h1
            className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Compare every feature
          </h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Find the perfect plan for your agency. Start free, scale as you grow.
          </p>
        </div>

        <PricingTable />
      </div>
    </main>
  );
}
```

**Step 2: Verify both routes load**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/pricing`
Expected: 200 200

**Step 3: Commit**

```bash
git add app/\(marketing\)/pricing/page.tsx
git commit -m "feat: update /pricing page with comparison table layout"
```

---

### Task 6: Visual verification and cleanup

**Files:**
- None (verification only)

**Step 1: Verify homepage pricing section renders correctly**

Open `http://localhost:3000/#pricing` in the browser. Check:
- Section badge pill says "Pricing"
- Plus Jakarta Sans font on headings (not Playfair Display)
- Steel-blue color palette (no bright blue)
- Monthly/yearly toggle works, prices update
- Three cards: Free / Basic / Pro
- Pro card has "Most Popular" badge and SparkleButton
- ScrollStagger animation on scroll
- "Compare all features →" link goes to /pricing
- Mobile responsive (single column)

**Step 2: Verify /pricing comparison table**

Open `http://localhost:3000/pricing`. Check:
- Page header with badge pill
- Billing toggle works
- Desktop: 4-column table with sticky header
- Feature groups with correct checkmarks/values
- Pro column has subtle background highlight
- Mobile: card-per-tier layout (not broken table)

**Step 3: Check that Playfair Display is no longer imported**

Run: `grep -r "Playfair" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css" || echo "Clean - no Playfair references"`
Expected: Clean - no Playfair references

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: pricing redesign cleanup and verification"
```
