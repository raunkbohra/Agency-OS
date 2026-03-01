'use client';

import { FormEvent, useState } from 'react';
import { Plan } from '@/lib/db-queries';

interface SimpleClientFormProps {
  action: (formData: FormData) => Promise<void>;
  plans: Plan[];
}

export function SimpleClientForm({ action, plans }: SimpleClientFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

      <button
        type="submit"
        disabled={isSubmitting || plans.length === 0}
        className="w-full bg-accent-blue text-white py-2 px-4 rounded-md font-medium hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Creating Client...' : 'Create Client'}
      </button>
    </form>
  );
}
