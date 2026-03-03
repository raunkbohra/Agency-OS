'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plan, ClientPlan } from '@/lib/db-queries';
import { Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PlanEditFormProps {
  clientPlan: ClientPlan;
  currentPlan: Plan;
  clientId: string;
}

export default function PlanEditForm({ clientPlan, currentPlan, clientId }: PlanEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState(clientPlan.plan_id);
  const [status, setStatus] = useState(clientPlan.status);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/plans`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          status: status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      setSuccess(true);
      toast({ title: 'Plan updated!' });
      const t = setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
      return () => clearTimeout(t);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update plan';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-tertiary border border-border-default rounded hover:bg-bg-hover transition-colors"
      >
        <Edit2 className="h-3 w-3" />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary border border-border-default rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-bg-primary">
              <h2 className="text-lg font-semibold text-text-primary">Change Plan</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Plan updated successfully!
                </div>
              )}

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-text-primary mb-1.5">
                  Select Plan *
                </label>
                {loading ? (
                  <p className="text-sm text-text-tertiary">Loading plans...</p>
                ) : (
                  <select
                    id="plan"
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1.5">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-border-default mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-text-primary bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={!selectedPlanId}
                  loading={isSubmitting}
                  success={success}
                  className="flex-1"
                >
                  Update Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
