'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';

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
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For freelancers getting started.',
    features: [
      { text: 'Up to 3 clients', included: true },
      { text: '1 service plan', included: true },
      { text: 'Basic invoicing', included: true },
      { text: 'Contracts', included: false },
      { text: 'Deliverables tracking', included: false },
      { text: 'Metrics dashboard', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/auth/signin',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For growing agencies.',
    features: [
      { text: 'Unlimited clients', included: true },
      { text: 'Unlimited plans', included: true },
      { text: 'Advanced invoicing', included: true },
      { text: 'Contracts', included: true },
      { text: 'Deliverables tracking', included: true },
      { text: 'Metrics dashboard', included: true },
    ],
    cta: 'Get Started',
    ctaHref: '/auth/signin',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For established agencies.',
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
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">
            Simple pricing
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Start free. Upgrade when you need to.
          </p>
        </div>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <ScrollStaggerItem key={tier.name}>
              <div
                className={`relative rounded-xl p-8 h-full flex flex-col ${
                  tier.featured
                    ? 'border-2 border-accent-blue/30 bg-bg-secondary animated-border'
                    : 'border border-border-default bg-bg-secondary'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent-blue px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-tight text-text-primary">{tier.price}</span>
                  <span className="text-text-tertiary">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent-green flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-text-quaternary flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-sm text-text-secondary' : 'text-sm text-text-quaternary line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.featured ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link href={tier.ctaHref}>{tier.cta}</Link>
                </Button>
              </div>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
