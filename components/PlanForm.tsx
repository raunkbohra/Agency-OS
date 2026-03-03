'use client';

import { FormEvent, useState } from 'react';
import { Plan } from '@/lib/db-queries';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PlanFormProps {
  onSubmit: (data: {
    name: string;
    price: number;
    billingCycle: string;
    description?: string;
  }) => Promise<void>;
  initialData?: Partial<Plan>;
  isLoading?: boolean;
}

export function PlanForm({ onSubmit, initialData, isLoading = false }: PlanFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState<string | number>(initialData?.price ? parseFloat(initialData.price as unknown as string) : '');
  const [billingCycle, setBillingCycle] = useState(initialData?.billing_cycle || 'monthly');
  const [description, setDescription] = useState(initialData?.description || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Plan name is required');
      return;
    }

    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (!priceNum || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: Number(price),
        billingCycle,
        description: description.trim() || undefined,
      });
      setSuccess(true);
      toast({ title: 'Plan saved!' });
      setTimeout(() => setSuccess(false), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      toast({ title: message, variant: 'destructive' });
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
          Plan Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Basic Plan"
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-text-secondary mb-1">
          Price (NPR)
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          step="0.01"
          min="0"
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <div>
        <label htmlFor="billingCycle" className="block text-sm font-medium text-text-secondary mb-1">
          Billing Cycle
        </label>
        <select
          id="billingCycle"
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value)}
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30"
          disabled={isSubmitting || isLoading}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter plan description"
          rows={4}
          className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-md focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 placeholder-text-tertiary"
          disabled={isSubmitting || isLoading}
        />
      </div>

      <Button
        type="submit"
        loading={isSubmitting || isLoading}
        success={success}
        className="w-full"
      >
        Save Plan
      </Button>
    </form>
  );
}
