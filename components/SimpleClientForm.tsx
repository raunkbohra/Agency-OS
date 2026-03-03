'use client';

import { FormEvent, useState } from 'react';
import { Plan } from '@/lib/db-queries';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const BILLING_OPTIONS = [
  {
    value: 'next_month' as const,
    label: 'Start next full period',
    description: 'No deliverables or invoice for the current partial month. Full billing starts next period.',
  },
  {
    value: 'prorated' as const,
    label: 'Pro-rate first period',
    description: 'Deliverables and invoice proportional to remaining days this month. Full billing from next period.',
  },
];

interface SimpleClientFormProps {
  action: (formData: FormData) => Promise<void>;
  plans: Plan[];
}

export function SimpleClientForm({ action, plans }: SimpleClientFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [billingPolicy, setBillingPolicy] = useState<'next_month' | 'prorated'>('next_month');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
      setSuccess(true);
      toast({ id: 'client-create-success', title: 'Client created!' });
      setTimeout(() => setSuccess(false), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({ id: 'client-create-error', title: message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
          Client Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="e.g., John's Company"
          className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-tertiary text-text-primary placeholder-text-tertiary focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="e.g., john@example.com"
          className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-tertiary text-text-primary placeholder-text-tertiary focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary mb-1">
          Company Name (Optional)
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          placeholder="e.g., Example Corp"
          className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-tertiary text-text-primary placeholder-text-tertiary focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="planId" className="block text-sm font-medium text-text-secondary mb-1">
          Plan
        </label>
        <select
          id="planId"
          name="planId"
          className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-tertiary text-text-primary focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting}
          required
        >
          <option value="">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - NPR {Number(plan.price).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          First Month Billing
        </label>
        <div className="space-y-2">
          {BILLING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                billingPolicy === opt.value
                  ? 'border-accent-blue bg-accent-blue/5'
                  : 'border-border-default bg-bg-tertiary hover:bg-bg-hover'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <div
                  className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    billingPolicy === opt.value ? 'border-accent-blue' : 'border-border-hover'
                  }`}
                >
                  {billingPolicy === opt.value && (
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
                name="billingStartPolicy"
                value={opt.value}
                checked={billingPolicy === opt.value}
                onChange={() => setBillingPolicy(opt.value)}
                disabled={isSubmitting}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={plans.length === 0}
        loading={isSubmitting}
        success={success}
        className="w-full"
      >
        Create Client
      </Button>
    </form>
  );
}
