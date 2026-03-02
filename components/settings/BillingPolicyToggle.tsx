'use client';

import { useState, useEffect } from 'react';

interface Props {
  initialPolicy: 'next_month' | 'prorated';
}

const OPTIONS = [
  {
    value: 'next_month' as const,
    label: 'Start next full period',
    description:
      'Client joins March 21 → no March deliverables or invoice. Everything starts April 1 at full price.',
  },
  {
    value: 'prorated' as const,
    label: 'Pro-rate the first period',
    description:
      'Client joins March 21 → invoice and deliverables are proportional to the remaining days (10/31 ≈ 32%). Full billing from April.',
  },
];

export default function BillingPolicyToggle({ initialPolicy }: Props) {
  const [policy, setPolicy] = useState<'next_month' | 'prorated'>(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  async function handleChange(value: 'next_month' | 'prorated') {
    setPolicy(value);
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch('/api/settings/billing-policy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: value }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
      setPolicy(initialPolicy);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2.5">
      {OPTIONS.map(opt => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
            policy === opt.value
              ? 'border-accent-blue bg-accent-blue/5'
              : 'border-border-default bg-bg-primary hover:bg-bg-hover'
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            <div
              className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                policy === opt.value ? 'border-accent-blue' : 'border-border-hover'
              }`}
            >
              {policy === opt.value && (
                <div className="h-2 w-2 rounded-full bg-accent-blue" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{opt.label}</p>
            <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{opt.description}</p>
          </div>
          <input
            type="radio"
            name="billing_policy"
            value={opt.value}
            checked={policy === opt.value}
            onChange={() => handleChange(opt.value)}
            disabled={saving}
            className="sr-only"
          />
        </label>
      ))}

      <div className="h-4 flex items-center">
        {saving && <p className="text-xs text-text-tertiary">Saving…</p>}
        {saved && <p className="text-xs text-accent-green">Saved</p>}
        {error && <p className="text-xs text-accent-red">{error}</p>}
      </div>
    </div>
  );
}
