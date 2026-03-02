'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, RefreshCw, Calendar, Pencil, Trash2, Plus, X } from 'lucide-react';
import type { Plan, PlanItem } from '@/lib/db-queries';

interface PlanEditorProps {
  plan: Plan;
  planItems: PlanItem[];
}

const BILLING_CYCLES = ['monthly', 'weekly', 'bi-weekly', 'quarterly', 'yearly'];
const RECURRENCE_OPTIONS = ['monthly', 'weekly', 'bi-weekly', 'quarterly', 'yearly'];

export default function PlanEditor({ plan: initialPlan, planItems: initialItems }: PlanEditorProps) {
  const router = useRouter();

  // Plan state
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [items, setItems] = useState<PlanItem[]>(initialItems);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initialPlan.name);
  const [editPrice, setEditPrice] = useState(String(initialPlan.price));
  const [editBillingCycle, setEditBillingCycle] = useState(initialPlan.billing_cycle);
  const [editDescription, setEditDescription] = useState(initialPlan.description ?? '');
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Delete plan state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);

  // Add item state
  const [newType, setNewType] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newRecurrence, setNewRecurrence] = useState('monthly');
  const [addingItem, setAddingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Deleting items
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // ── Edit plan handlers ─────────────────────────────────────────────────────

  function handleStartEdit() {
    setEditName(plan.name);
    setEditPrice(String(plan.price));
    setEditBillingCycle(plan.billing_cycle);
    setEditDescription(plan.description ?? '');
    setPlanError(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setPlanError(null);
    setIsEditing(false);
  }

  async function handleSavePlan() {
    if (!editName.trim()) {
      setPlanError('Plan name is required.');
      return;
    }
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setPlanError('Price must be a positive number.');
      return;
    }

    setSavingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          price: priceNum,
          billingCycle: editBillingCycle,
          description: editDescription.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save plan');
      }

      const updated: Plan = await res.json();
      setPlan(updated);
      setIsEditing(false);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  }

  // ── Delete plan handlers ───────────────────────────────────────────────────

  async function handleConfirmDelete() {
    setDeletingPlan(true);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete plan');
      }
      router.push('/dashboard/plans');
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to delete plan');
      setDeletingPlan(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Plan item handlers ─────────────────────────────────────────────────────

  async function handleAddItem() {
    if (!newType.trim()) {
      setItemError('Deliverable type is required.');
      return;
    }
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) {
      setItemError('Quantity must be at least 1.');
      return;
    }

    setAddingItem(true);
    setItemError(null);
    try {
      const res = await fetch(`/api/plans/${plan.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverableType: newType.trim(),
          qty,
          recurrence: newRecurrence,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add item');
      }

      const item: PlanItem = await res.json();
      setItems((prev) => [...prev, item]);
      setNewType('');
      setNewQty('1');
      setNewRecurrence('monthly');
    } catch (err) {
      setItemError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    setDeletingItemId(itemId);
    try {
      const res = await fetch(`/api/plan-items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete item');
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setItemError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* ── Main plan card ── */}
      <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-xl p-6 space-y-6">

        {/* Plan name + description */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
                Plan Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 placeholder-text-tertiary"
                placeholder="Plan name"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 placeholder-text-tertiary resize-none"
                placeholder="Optional description"
              />
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{plan.name}</h1>
            {plan.description && (
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{plan.description}</p>
            )}
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Price */}
          <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3.5 w-3.5 text-text-tertiary" />
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Price</p>
            </div>
            {isEditing ? (
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-bg-secondary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20"
              />
            ) : (
              <p className="text-lg font-bold text-text-primary">
                NPR {Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            )}
          </div>

          {/* Billing cycle */}
          <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default">
            <div className="flex items-center gap-1.5 mb-2">
              <RefreshCw className="h-3.5 w-3.5 text-text-tertiary" />
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Billing</p>
            </div>
            {isEditing ? (
              <select
                value={editBillingCycle}
                onChange={(e) => setEditBillingCycle(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-bg-secondary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-bold text-text-primary capitalize">{plan.billing_cycle}</p>
            )}
          </div>

          {/* Created date */}
          <div className="bg-bg-tertiary rounded-lg p-4 border border-border-default col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Created</p>
            </div>
            <p className="text-sm font-semibold text-text-primary">
              {new Date(plan.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Error display */}
        {planError && (
          <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-3 py-2 rounded-lg text-sm">
            {planError}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t border-border-default flex flex-wrap gap-3 items-center">
          {isEditing ? (
            <>
              <button
                onClick={handleSavePlan}
                disabled={savingPlan}
                className="px-3 py-1.5 text-xs font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingPlan ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={savingPlan}
                className="px-3 py-1.5 text-xs font-semibold border border-border-default text-text-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit Plan
              </button>

              {/* Delete plan — inline confirmation */}
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary">Are you sure? This cannot be undone.</span>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deletingPlan}
                    className="px-3 py-1.5 text-xs font-semibold bg-accent-red text-white rounded-lg hover:bg-accent-red/90 disabled:opacity-50 transition-colors"
                  >
                    {deletingPlan ? 'Deleting…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deletingPlan}
                    className="px-3 py-1.5 text-xs font-semibold border border-border-default text-text-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setPlanError(null); setShowDeleteConfirm(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-accent-red/30 text-accent-red rounded-lg hover:bg-accent-red/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Plan
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Plan items sidebar ── */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">Deliverables</h2>
        </div>

        {/* Item error */}
        {itemError && (
          <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-3 py-2 rounded-lg text-xs">
            {itemError}
          </div>
        )}

        {/* Existing items */}
        {items.length === 0 ? (
          <p className="text-sm text-text-tertiary">No items added yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{item.deliverable_type}</p>
                  <p className="text-xs text-text-tertiary">{item.qty}× per {item.recurrence}</p>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={deletingItemId === item.id}
                  aria-label={`Remove ${item.deliverable_type}`}
                  className="flex-shrink-0 p-1 text-text-tertiary hover:text-accent-red disabled:opacity-40 transition-colors rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add item row */}
        <div className="pt-3 border-t border-border-default space-y-2">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Add Item</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Deliverable type"
              className="w-full px-3 py-2 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20 placeholder-text-tertiary"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                min="1"
                placeholder="Qty"
                className="w-16 px-3 py-2 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20"
              />
              <select
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-accent-blue/60 focus:ring-1 focus:ring-accent-blue/20"
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                disabled={addingItem}
                aria-label="Add item"
                className="flex-shrink-0 p-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
