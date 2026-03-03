# Deliverables Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the deliverables page into a modern SaaS dashboard with compact stats, unified toolbar with search, onboarding empty state, and smooth animations. List view only.

**Architecture:** Rewrite `DeliverablesList.tsx` as the main orchestrator. Replace `DeliverableStats` with a compact inline bar. Add client-side search. Replace empty state with onboarding guide. Use existing Framer Motion patterns (StaggerChildren, AnimatedNumber). Remove Calendar view references.

**Tech Stack:** Next.js, React, Tailwind CSS, Framer Motion (already installed), Lucide icons (already installed)

---

### Task 1: Create Compact DeliverableStatsBar Component

**Files:**
- Create: `components/DeliverableStatsBar.tsx`

**Step 1: Create the compact stats bar**

```tsx
'use client';

import { useMemo } from 'react';

interface DeliverableStatsBarProps {
  deliverables: { status: string }[];
}

export function DeliverableStatsBar({ deliverables }: DeliverableStatsBarProps) {
  const stats = useMemo(() => {
    const pending = deliverables.filter(d =>
      d.status === 'draft' || d.status === 'changes_requested'
    ).length;
    const inReview = deliverables.filter(d => d.status === 'in_review').length;
    const done = deliverables.filter(d => d.status === 'done' || d.status === 'approved').length;
    const total = deliverables.length;
    const completionPercent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { pending, inReview, done, completionPercent, total };
  }, [deliverables]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-blue" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.pending}</span> Pending
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-amber" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.inReview}</span> In Review
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-green" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.done}</span> Done
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-text-tertiary" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.completionPercent}%</span> Complete
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Verify it renders**

Run: `npm run dev` and check the component exists without errors.

**Step 3: Commit**

```bash
git add components/DeliverableStatsBar.tsx
git commit -m "feat: add compact DeliverableStatsBar component"
```

---

### Task 2: Create Onboarding Empty State Component

**Files:**
- Create: `components/DeliverableEmptyState.tsx`

**Step 1: Create the onboarding empty state**

```tsx
'use client';

import Link from 'next/link';
import { Users, ClipboardList, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeliverableEmptyStateProps {
  onCreateClick: () => void;
  hasFilter?: boolean;
  filterLabel?: string;
}

const steps = [
  {
    icon: Users,
    title: 'Add a Client',
    description: 'Start by adding your first client to the system.',
    href: '/dashboard/clients',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
  },
  {
    icon: ClipboardList,
    title: 'Create a Plan',
    description: 'Set up a service plan with deliverables and pricing.',
    href: '/dashboard/plans',
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
  },
  {
    icon: CheckCircle,
    title: 'Track Deliverables',
    description: 'Monitor progress, review work, and keep clients updated.',
    href: null,
    color: 'text-accent-green',
    bgColor: 'bg-accent-green/10',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DeliverableEmptyState({ onCreateClick, hasFilter, filterLabel }: DeliverableEmptyStateProps) {
  // If there's an active filter, show a simpler message
  if (hasFilter) {
    return (
      <div className="text-center py-16 bg-bg-secondary rounded-xl border border-border-default">
        <div className="mx-auto w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center mb-4">
          <ClipboardList className="h-5 w-5 text-text-tertiary" />
        </div>
        <p className="text-sm font-medium text-text-secondary">
          No deliverables {filterLabel ? `with status "${filterLabel}"` : 'matching your filters'}.
        </p>
        <p className="text-xs text-text-tertiary mt-1">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="py-12 sm:py-16"
    >
      {/* Header */}
      <motion.div variants={item} className="text-center mb-10">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
          <ClipboardList className="h-7 w-7 text-accent-blue" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">No deliverables yet</h3>
        <p className="text-sm text-text-tertiary mt-1.5 max-w-md mx-auto">
          Get started in 3 simple steps to begin tracking your client work.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const content = (
            <div className="relative p-5 rounded-xl border border-border-default bg-bg-secondary hover:border-border-hover hover:bg-bg-hover transition-all group">
              {/* Step number */}
              <span className="absolute top-3 right-3 text-[10px] font-bold text-text-tertiary/50">
                {i + 1}
              </span>
              <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <p className="text-sm font-semibold text-text-primary">{step.title}</p>
              <p className="text-xs text-text-tertiary mt-1 leading-relaxed">{step.description}</p>
              {step.href && (
                <div className="flex items-center gap-1 mt-3">
                  <span className={`text-xs font-medium ${step.color}`}>Get started</span>
                  <ArrowRight className={`h-3 w-3 ${step.color} group-hover:translate-x-0.5 transition-transform`} />
                </div>
              )}
            </div>
          );

          return step.href ? (
            <Link key={step.title} href={step.href}>
              {content}
            </Link>
          ) : (
            <div key={step.title}>{content}</div>
          );
        })}
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="text-center">
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Your First Deliverable
        </button>
        <p className="text-xs text-text-tertiary mt-3">
          Or create a deliverable directly if you already have clients and plans set up.
        </p>
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add components/DeliverableEmptyState.tsx
git commit -m "feat: add onboarding empty state for deliverables"
```

---

### Task 3: Rewrite DeliverablesList — Header, Stats, Search, Toolbar

This is the main rewrite. Replace the entire `DeliverablesList.tsx` with the new layout.

**Files:**
- Modify: `components/DeliverablesList.tsx` (full rewrite)

**Step 1: Rewrite DeliverablesList.tsx**

The new structure is:
1. Header row: title is handled by the parent page, so we just show stats bar + New button
2. Search input
3. Status filter pills (horizontally scrollable on mobile)
4. Sort + Urgent + Group + Bulk controls
5. Content: list (mobile cards / desktop table) or grouped view
6. Empty state when no deliverables

Key changes from current code:
- Remove duplicate `<DeliverableStats>` (lines 137 AND 277)
- Replace with single `<DeliverableStatsBar>` at top
- Remove Calendar view, `activeView` state, and view toggle
- Remove `DeliverableCalendar` import
- Add `searchQuery` state for client-side filtering
- Add search input to toolbar
- Replace empty state div with `<DeliverableEmptyState>`
- Wrap list items with `AnimatePresence` + `motion.div` for filter transitions
- Use `StaggerChildren`/`StaggerItem` for initial load animation on skeleton

Here is the complete new file:

```tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewDeliverableModal from './NewDeliverableModal';
import { DeliverableStatsBar } from './DeliverableStatsBar';
import { DeliverableGroupedList } from './DeliverableGroupedList';
import { DeliverableEmptyState } from './DeliverableEmptyState';
import { toast } from '@/components/ui/use-toast';

interface Deliverable {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

const STATUS_OPTIONS = ['all', 'draft', 'in_review', 'approved', 'changes_requested', 'done'];
const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due Date (Earliest)' },
  { value: 'due_date_desc', label: 'Due Date (Latest)' },
  { value: 'client', label: 'Client (A-Z)' },
  { value: 'status', label: 'Status' },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-bg-hover text-text-primary',
  in_review: 'bg-accent-blue/10 text-accent-blue',
  approved: 'bg-accent-green/10 text-accent-green',
  changes_requested: 'bg-accent-amber/10 text-accent-amber',
  done: 'bg-accent-purple/10 text-accent-purple',
};

export default function DeliverablesList() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgent, setUrgent] = useState(false);
  const [sort, setSort] = useState('due_date');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          urgent: urgent.toString(),
          sort,
        });
        const res = await fetch(`/api/deliverables?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDeliverables(data);
      } catch {
        setError('Failed to load deliverables');
      } finally {
        setLoading(false);
      }
    };
    fetchDeliverables();
  }, [statusFilter, urgent, sort]);

  // Client-side search filter
  const filteredDeliverables = useMemo(() => {
    if (!searchQuery.trim()) return deliverables;
    const q = searchQuery.toLowerCase();
    return deliverables.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.client_name.toLowerCase().includes(q)
    );
  }, [deliverables, searchQuery]);

  const handleCreated = (deliverable: any) => {
    setDeliverables((prev) => [
      { ...deliverable, client_name: deliverable.client_name ?? '' },
      ...prev,
    ]);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedBulk.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/deliverables/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBulk, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setDeliverables((prev) =>
        prev.map((d) =>
          selectedBulk.includes(d.id) ? { ...d, status: newStatus } : d
        )
      );
      setSelectedBulk([]);
      setBulkStatus(null);
      setBulkMode(false);
    } catch (err) {
      console.error('Bulk update error:', err);
      toast({
        variant: 'destructive' as const,
        title: 'Bulk update failed',
        description: 'Could not update the selected deliverables. Please try again.',
      } as any);
    } finally {
      setBulkLoading(false);
    }
  };

  const hasActiveFilter = statusFilter !== 'all' || urgent || searchQuery.trim() !== '';

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {/* Stats bar skeleton */}
        <div className="h-5 w-64 rounded bg-bg-secondary animate-pulse" />
        {/* Toolbar skeleton */}
        <div className="h-10 rounded-xl bg-bg-secondary animate-pulse" />
        <div className="h-8 w-3/4 rounded-lg bg-bg-secondary animate-pulse" />
        {/* Table skeleton */}
        <div className="space-y-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-accent-red text-sm p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar + New Deliverable button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <DeliverableStatsBar deliverables={deliverables} />
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> New Deliverable
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search deliverables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 rounded-lg text-sm border border-border-default bg-bg-secondary text-text-primary placeholder:text-text-tertiary focus:border-border-active focus:outline-none focus:ring-1 focus:ring-border-active transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-bg-hover transition-colors"
          >
            <X className="h-3.5 w-3.5 text-text-tertiary" />
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="mb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg capitalize text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === status
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row: Urgent + Sort + Group + Bulk */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-text-secondary">Urgent</span>
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border border-border-default bg-bg-secondary text-text-primary focus:border-border-active focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs font-medium text-text-secondary">Group by Client</span>
        </label>

        <button
          onClick={() => {
            setBulkMode(!bulkMode);
            setSelectedBulk([]);
            setBulkStatus(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            bulkMode
              ? 'bg-accent-blue text-white'
              : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
          }`}
        >
          {bulkMode ? 'Cancel' : 'Bulk Select'}
        </button>
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedBulk.length > 0 && (
        <div className="mb-4 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-accent-blue">
            {selectedBulk.length} {selectedBulk.length === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus || ''}
              onChange={(e) => setBulkStatus(e.target.value || null)}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg text-xs border border-border-default bg-white text-text-primary focus:border-border-active focus:outline-none disabled:opacity-50"
            >
              <option value="">Change Status to...</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={() => {
                if (bulkStatus) handleBulkStatusChange(bulkStatus);
              }}
              disabled={!bulkStatus || bulkLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      <NewDeliverableModal isOpen={showModal} onClose={() => setShowModal(false)} onCreated={handleCreated} />

      {/* Content */}
      {filteredDeliverables.length === 0 ? (
        <DeliverableEmptyState
          onCreateClick={() => setShowModal(true)}
          hasFilter={hasActiveFilter}
          filterLabel={statusFilter !== 'all' ? statusFilter.replace('_', ' ') : undefined}
        />
      ) : (
        <>
          {grouped ? (
            <DeliverableGroupedList
              deliverables={filteredDeliverables}
              bulkMode={bulkMode}
              onBulkSelect={setSelectedBulk}
            />
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredDeliverables.map((d) => (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={`/dashboard/deliverables/${d.id}`}
                        className="flex items-start justify-between gap-3 p-4 bg-bg-secondary rounded-xl border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
                        onClick={(e) => {
                          if (bulkMode && (e.target as HTMLElement).closest('input')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {bulkMode && (
                            <input
                              type="checkbox"
                              checked={selectedBulk.includes(d.id)}
                              onChange={() => {
                                const newSelected = selectedBulk.includes(d.id)
                                  ? selectedBulk.filter((id) => id !== d.id)
                                  : [...selectedBulk, d.id];
                                setSelectedBulk(newSelected);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary truncate">{d.title}</p>
                            <p className="text-xs text-text-tertiary mt-0.5 truncate">
                              {d.client_name || '\u2014'} \u00b7 {d.month_year}
                            </p>
                            {d.due_date && (
                              <p className="text-xs text-text-tertiary mt-0.5">
                                Due {new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
                <table className="w-full">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      {bulkMode && (
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={filteredDeliverables.every((d) => selectedBulk.includes(d.id))}
                            onChange={() => {
                              if (filteredDeliverables.every((d) => selectedBulk.includes(d.id))) {
                                setSelectedBulk([]);
                              } else {
                                setSelectedBulk(filteredDeliverables.map((d) => d.id));
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    <AnimatePresence mode="popLayout">
                      {filteredDeliverables.map((d) => (
                        <motion.tr
                          key={d.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="hover:bg-bg-hover transition-colors"
                        >
                          {bulkMode && (
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedBulk.includes(d.id)}
                                onChange={() => {
                                  const newSelected = selectedBulk.includes(d.id)
                                    ? selectedBulk.filter((id) => id !== d.id)
                                    : [...selectedBulk, d.id];
                                  setSelectedBulk(newSelected);
                                }}
                                className="rounded"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm font-medium text-text-primary">{d.title}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{d.client_name || '\u2014'}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                              {d.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link href={`/dashboard/deliverables/${d.id}`} className="text-accent-blue hover:underline text-sm">
                              View
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: Verify the page renders**

Run: `npm run dev` and navigate to `/dashboard/deliverables`. Verify:
- No duplicate stats cards
- Compact stats bar shows at top
- Search input is present
- Status pills are horizontally scrollable on mobile
- Empty state shows onboarding guide
- No Calendar view toggle

**Step 3: Commit**

```bash
git add components/DeliverablesList.tsx
git commit -m "feat: redesign deliverables list with compact stats, search, and onboarding empty state"
```

---

### Task 4: Update DeliverableGroupedList to Use Compact Stats

**Files:**
- Modify: `components/DeliverableGroupedList.tsx`

**Step 1: Replace DeliverableStats with DeliverableStatsBar in grouped view**

In `DeliverableGroupedList.tsx`, change the import from:
```tsx
import DeliverableStats from './DeliverableStats';
```
to:
```tsx
import { DeliverableStatsBar } from './DeliverableStatsBar';
```

And replace the per-group stats render (lines 169-173) from:
```tsx
<div className="px-4 pt-3 pb-1 border-t border-border-default bg-bg-tertiary">
  <DeliverableStats
    deliverables={items as unknown as Deliverable[]}
  />
</div>
```
to:
```tsx
<div className="px-4 py-3 border-t border-border-default bg-bg-tertiary">
  <DeliverableStatsBar deliverables={items} />
</div>
```

Also remove the unused `Deliverable` import from `@/lib/db-queries`.

**Step 2: Verify grouped view works**

Run: `npm run dev`, navigate to deliverables, check "Group by Client", verify per-group stats show as compact bar.

**Step 3: Commit**

```bash
git add components/DeliverableGroupedList.tsx
git commit -m "refactor: use compact stats bar in grouped deliverables view"
```

---

### Task 5: Add Tailwind Scrollbar-Hide Utility

**Files:**
- Modify: `tailwind.config.ts` or `app/globals.css`

**Step 1: Add scrollbar-none utility**

Check if `scrollbar-none` class is already defined. If not, add to `app/globals.css`:

```css
/* Hide scrollbar for horizontal scroll containers */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

**Step 2: Verify status pills scroll smoothly on mobile**

Resize browser to 375px width, confirm status pills scroll horizontally without visible scrollbar.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add scrollbar-none utility for horizontal scroll containers"
```

---

### Task 6: Visual QA and Final Polish

**Files:**
- Possibly modify: `components/DeliverablesList.tsx`, `components/DeliverableEmptyState.tsx`, `components/DeliverableStatsBar.tsx`

**Step 1: Test all three breakpoints**

Test at these viewport widths:
- **Mobile (375px)**: Stats as 2x2 chip grid (they naturally wrap via flex-wrap), search full-width, pills scroll, card list for items
- **Tablet (768px)**: Stats inline, full toolbar, table view
- **Desktop (1440px)**: Stats inline, full toolbar, table view

**Step 2: Test interactions**

- Search: type a query, verify list filters in real-time
- Status pills: click each one, verify API refetch
- Urgent checkbox: toggle, verify refetch
- Sort: change dropdown, verify refetch
- Group by Client: toggle, verify grouped view appears with compact per-group stats
- Bulk select: toggle, select items, change status, verify update
- Empty state: clear all deliverables or filter to show none, verify onboarding guide appears
- Empty state with filter: apply a status filter that returns 0, verify simpler "no matching" message

**Step 3: Fix any spacing/alignment issues found during QA**

**Step 4: Commit**

```bash
git add -A
git commit -m "polish: visual QA fixes for deliverables redesign"
```
