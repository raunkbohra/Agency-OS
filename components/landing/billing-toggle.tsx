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
