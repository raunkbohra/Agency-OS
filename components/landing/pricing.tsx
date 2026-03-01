'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';
import { SparkleButton } from '@/components/ui/sparkle-button';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
  featured: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For freelancers getting started.',
    features: [
      { text: 'Up to 3 clients', included: true },
      { text: '1 service plan', included: true },
      { text: 'Basic invoicing', included: true },
      { text: 'Contracts', included: false },
      { text: 'Deliverables tracking', included: false },
      { text: 'Metrics dashboard', included: false },
    ],
    cta: 'Get Started Free',
    ctaHref: '/auth/signin',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing agencies that ship.',
    features: [
      { text: 'Unlimited clients', included: true },
      { text: 'Unlimited plans', included: true },
      { text: 'Advanced invoicing', included: true },
      { text: 'Contracts', included: true },
      { text: 'Deliverables tracking', included: true },
      { text: 'Metrics dashboard', included: true },
    ],
    cta: 'Start Pro',
    ctaHref: '/auth/signin',
    featured: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For established agencies at scale.',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom branding', included: true },
    ],
    cta: 'Contact Us',
    ctaHref: '#',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6" style={{ background: 'linear-gradient(180deg, #060609 0%, #08080f 100%)' }}>
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
          >
            Pricing
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg" style={{ color: '#6b7280' }}>
            Start free. Upgrade when you need to. No surprises.
          </p>
        </div>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <ScrollStaggerItem key={tier.name}>
              <div
                className="relative flex flex-col h-full rounded-2xl p-7 transition-all duration-300"
                style={{
                  background: tier.featured ? 'rgba(107, 126, 147, 0.06)' : 'rgba(12, 12, 20, 0.8)',
                  border: tier.featured
                    ? '1px solid rgba(107, 126, 147, 0.35)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: tier.featured
                    ? '0 0 60px rgba(107, 126, 147, 0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
                    : 'none',
                }}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="px-3 py-1 text-[11px] font-semibold text-white rounded-full"
                      style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Plan name & description */}
                <div className="mb-6">
                  <h3
                    className="text-base font-bold mb-1"
                    style={{ color: tier.featured ? '#b0bec8' : '#9ca3af' }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#555565' }}>{tier.description}</p>
                </div>

                {/* Price */}
                <div className="mb-7 flex items-end gap-1">
                  <span
                    className="text-5xl font-black tracking-tight text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm mb-1.5" style={{ color: '#555565' }}>{tier.period}</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <div
                          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0, 200, 83, 0.15)', border: '1px solid rgba(0,200,83,0.3)' }}
                        >
                          <Check size={9} style={{ color: '#00c853' }} />
                        </div>
                      ) : (
                        <div
                          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <Minus size={9} style={{ color: '#444455' }} />
                        </div>
                      )}
                      <span
                        className="text-sm"
                        style={{ color: feature.included ? '#d1d5db' : '#444455' }}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier.featured ? (
                  <SparkleButton href={tier.ctaHref} className="w-full justify-center">
                    {tier.cta}
                  </SparkleButton>
                ) : (
                  <Link
                    href={tier.ctaHref}
                    className="block text-center py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#d1d5db',
                    }}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
