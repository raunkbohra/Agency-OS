'use client';

import { FormEvent, useState } from 'react';
import { Client, Plan } from '@/lib/db-queries';

interface ClientFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    companyName?: string;
    planId: string;
  }) => Promise<void>;
  initialData?: Partial<Client & { planId?: string }>;
  isLoading?: boolean;
  plans: Plan[];
}

export function ClientForm({
  onSubmit,
  initialData,
  isLoading = false,
  plans,
}: ClientFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [companyName, setCompanyName] = useState(initialData?.company_name || '');
  const [planId, setPlanId] = useState(initialData?.planId || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!planId) {
      setError('Please select a plan');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        companyName: companyName.trim() || undefined,
        planId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., John's Company"
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., john@example.com"
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-text-secondary mb-1">
          Company Name (Optional)
        </label>
        <input
          type="text"
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Example Corp"
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <div>
        <label htmlFor="planId" className="block text-sm font-medium text-text-secondary mb-1">
          Plan
        </label>
        <select
          id="planId"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting || isLoading}
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
        disabled={isSubmitting || isLoading || plans.length === 0}
        className="w-full bg-accent-blue text-white py-2 px-4 rounded-md font-medium hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting || isLoading ? (initialData ? 'Saving...' : 'Creating Client...') : (initialData ? 'Save Client' : 'Create Client')}
      </button>
    </form>
  );
}
