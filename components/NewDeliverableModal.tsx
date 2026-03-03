'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company_name: string | null;
}

interface ClientPlan {
  client_plan_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
}

interface NewDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (deliverable: any) => void;
}

export default function NewDeliverableModal({ isOpen, onClose, onCreated }: NewDeliverableModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [planId, setPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [itemTitles, setItemTitles] = useState<string[]>(['']);

  // Fetch clients when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingClients(true);
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  }, [isOpen]);

  // Fetch plans when client changes
  useEffect(() => {
    if (!clientId) {
      setClientPlans([]);
      setPlanId('');
      return;
    }
    setLoadingPlans(true);
    setPlanId('');
    fetch(`/api/clients/${clientId}/plans`)
      .then(res => res.json())
      .then(data => {
        const plans = Array.isArray(data) ? data : [];
        setClientPlans(plans);
        // Auto-select the first active plan if available
        const activePlan = plans.find((p: ClientPlan) => p.status === 'active') ?? plans[0];
        if (activePlan) setPlanId(activePlan.plan_id);
      })
      .catch(() => setError('Failed to load plans for this client'))
      .finally(() => setLoadingPlans(false));
  }, [clientId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientId('');
      setPlanId('');
      setTitle('');
      setMonthYear('');
      setDueDate('');
      setClientPlans([]);
      setError(null);
      setItemTitles(['']);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId || !title.trim() || !monthYear) {
      setError('Client, title, and month are required.');
      return;
    }

    if (!planId) {
      setError('This client has no plans assigned. Please assign a plan to the client first.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          planId,
          title: title.trim(),
          monthYear,
          dueDate: dueDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create deliverable');
      }

      const deliverable = await res.json();

      // Create items for the bundle
      const validItems = itemTitles.filter(t => t.trim());
      for (const itemTitle of validItems) {
        await fetch(`/api/deliverables/${deliverable.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: itemTitle.trim() }),
        });
      }

      onCreated(deliverable);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border-default text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-border-hover transition-colors';
  const labelClass = 'block text-xs font-medium text-text-secondary mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-primary border border-border-default rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">New Deliverable</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className={labelClass}>
              Client <span className="text-accent-red">*</span>
            </label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className={inputClass}
              disabled={loadingClients}
              required
            >
              <option value="">{loadingClients ? 'Loading clients…' : 'Select a client'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company_name ? ` (${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Plan — shown once a client is selected */}
          {clientId && (
            <div>
              <label className={labelClass}>
                Plan <span className="text-accent-red">*</span>
              </label>
              {loadingPlans ? (
                <div className="h-9 rounded-lg bg-bg-tertiary border border-border-default animate-pulse" />
              ) : clientPlans.length === 0 ? (
                <p className="text-xs text-accent-amber py-2">
                  No plans assigned to this client. Assign a plan first.
                </p>
              ) : (
                <select
                  value={planId}
                  onChange={e => setPlanId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select a plan</option>
                  {clientPlans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.plan_name}{p.status !== 'active' ? ` (${p.status})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelClass}>
              Title <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. July Blog Posts"
              className={inputClass}
              required
            />
          </div>

          {/* Month */}
          <div>
            <label className={labelClass}>
              Month <span className="text-accent-red">*</span>
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={e => setMonthYear(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className={labelClass}>Due Date <span className="text-text-tertiary font-normal">(optional)</span></label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Items */}
          <div>
            <label className={labelClass}>Items <span className="text-text-tertiary font-normal">(optional)</span></label>
            <div className="space-y-2">
              {itemTitles.map((itemTitle, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={e => {
                      const updated = [...itemTitles];
                      updated[idx] = e.target.value;
                      setItemTitles(updated);
                    }}
                    placeholder={`Item ${idx + 1}`}
                    className={inputClass}
                  />
                  {itemTitles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItemTitles(itemTitles.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setItemTitles([...itemTitles, ''])}
                className="flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
              >
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || loadingClients}
              className="w-full py-2.5 rounded-lg bg-accent-blue text-white text-sm font-semibold hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Deliverable'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
