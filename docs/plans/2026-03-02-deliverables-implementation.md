# Deliverables Tracking Enhancements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build 3 phases of deliverables enhancements: visibility/filtering, bulk operations/organization, client portal/notifications.

**Architecture:**
- Phase 1: Enhance existing API with filter/sort params, build stats widget component
- Phase 2: Add grouping UI, bulk PATCH endpoint, calendar grid view
- Phase 3: New public portal route with token auth, email notifications via existing infrastructure

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, PostgreSQL, existing email setup

---

## PHASE 1: Visibility & Filtering (Foundation)

### Task 1: Update API to support filtering and sorting

**Files:**
- Modify: `app/api/deliverables/route.ts` (GET handler)
- Modify: `lib/db-queries.ts` (add new query function)

**Step 1: Add new query function to db-queries.ts**

Add this function after existing `getDeliverablesByAgency`:

```typescript
/**
 * Get deliverables with optional filtering and sorting
 * @param agencyId - Agency ID
 * @param options.statusFilter - Filter by status ('draft', 'in_review', etc.) or 'all'
 * @param options.urgent - If true, only return items due within 7 days
 * @param options.sort - Sort by: 'due_date' | 'due_date_desc' | 'client' | 'status'
 */
export async function getDeliverablesFiltered(
  agencyId: string,
  options: {
    statusFilter?: string;
    urgent?: boolean;
    sort?: string;
  } = {}
): Promise<any[]> {
  const { statusFilter = 'all', urgent = false, sort = 'due_date' } = options;

  let query = `
    SELECT
      d.id, d.client_id, d.title, d.status, d.month_year, d.due_date,
      c.name as client_name
    FROM deliverables d
    LEFT JOIN clients c ON d.client_id = c.id
    WHERE d.agency_id = $1
  `;

  const params: any[] = [agencyId];
  let paramCount = 2;

  // Status filter
  if (statusFilter !== 'all') {
    query += ` AND d.status = $${paramCount}`;
    params.push(statusFilter);
    paramCount++;
  }

  // Urgent filter (due within 7 days)
  if (urgent) {
    query += ` AND d.due_date IS NOT NULL
              AND d.due_date >= NOW()
              AND d.due_date <= NOW() + INTERVAL '7 days'`;
  }

  // Sorting
  switch (sort) {
    case 'due_date_desc':
      query += ` ORDER BY d.due_date DESC NULLS LAST`;
      break;
    case 'client':
      query += ` ORDER BY c.name ASC, d.due_date ASC`;
      break;
    case 'status':
      query += ` ORDER BY d.status ASC, d.due_date ASC`;
      break;
    case 'due_date':
    default:
      query += ` ORDER BY d.due_date ASC NULLS LAST`;
  }

  const result = await db.query(query, params);
  return result.rows;
}
```

**Step 2: Update GET handler in route.ts**

Replace the entire GET handler with:

```typescript
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'all';
    const urgent = url.searchParams.get('urgent') === 'true';
    const sort = url.searchParams.get('sort') || 'due_date';

    const deliverables = await getDeliverablesFiltered(session.user.agencyId, {
      statusFilter,
      urgent,
      sort,
    });

    return Response.json(deliverables);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return Response.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
  }
}
```

**Step 3: Test the API**

Run locally and test with curl:
```bash
# Test basic fetch
curl http://localhost:3000/api/deliverables

# Test with status filter
curl http://localhost:3000/api/deliverables?status=done

# Test with urgent filter
curl http://localhost:3000/api/deliverables?urgent=true

# Test with sort
curl http://localhost:3000/api/deliverables?sort=client

# Test combined
curl http://localhost:3000/api/deliverables?status=all&urgent=true&sort=due_date
```

Expected: Returns JSON array with correct filtering/sorting applied.

**Step 4: Commit**

```bash
git add app/api/deliverables/route.ts lib/db-queries.ts
git commit -m "feat: add filtering and sorting to deliverables API"
```

---

### Task 2: Build DeliverableStats component

**Files:**
- Create: `components/DeliverableStats.tsx`

**Step 1: Create the component**

```typescript
'use client';

import React from 'react';

interface Deliverable {
  id: string;
  status: string;
}

interface DeliverableStatsProps {
  deliverables: Deliverable[];
}

export function DeliverableStats({ deliverables }: DeliverableStatsProps) {
  const total = deliverables.length;
  const pending = deliverables.filter(
    (d) => d.status === 'draft' || d.status === 'in_review' || d.status === 'changes_requested'
  ).length;
  const inReview = deliverables.filter((d) => d.status === 'in_review').length;
  const done = deliverables.filter((d) => d.status === 'done').length;
  const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
          Pending
        </p>
        <p className="text-2xl font-bold text-accent-blue">{pending}</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
          In Review
        </p>
        <p className="text-2xl font-bold text-accent-amber">{inReview}</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
          Done
        </p>
        <p className="text-2xl font-bold text-accent-green">{done}</p>
      </div>

      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
          Completion
        </p>
        <p className="text-2xl font-bold text-text-primary">{completionPercent}%</p>
      </div>
    </div>
  );
}
```

**Step 2: Test component locally**

In browser at `http://localhost:3000/dashboard/deliverables`, the stats should render (we'll wire it in next task).

**Step 3: Commit**

```bash
git add components/DeliverableStats.tsx
git commit -m "feat: create DeliverableStats component"
```

---

### Task 3: Integrate DeliverableStats and add filters to DeliverablesList

**Files:**
- Modify: `components/DeliverablesList.tsx` (entire refactor)

**Step 1: Replace entire DeliverablesList.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import NewDeliverableModal from './NewDeliverableModal';
import { DeliverableStats } from './DeliverableStats';

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

  const handleCreated = (deliverable: any) => {
    setDeliverables((prev) => [
      { ...deliverable, client_name: deliverable.client_name ?? '' },
      ...prev,
    ]);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
        ))}
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
      {/* Stats widget */}
      <DeliverableStats deliverables={deliverables} />

      {/* Filters + Sort + New Deliverable */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize text-xs font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New Deliverable
          </button>
        </div>

        {/* Urgent filter + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs font-medium text-text-secondary">Urgent (due within 7 days)</span>
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
        </div>
      </div>

      <NewDeliverableModal isOpen={showModal} onClose={() => setShowModal(false)} onCreated={handleCreated} />

      {deliverables.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
          No deliverables{statusFilter !== 'all' ? ` with status "${statusFilter.replace('_', ' ')}"` : ''}.
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {deliverables.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/deliverables/${d.id}`}
                className="flex items-start justify-between gap-3 p-4 bg-bg-secondary rounded-xl border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{d.title}</p>
                  <p className="text-xs text-text-tertiary mt-0.5 truncate">
                    {d.client_name || '—'} · {d.month_year}
                  </p>
                  {d.due_date && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Due {new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                    {d.status.replace(/_/g, ' ')}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {deliverables.map((d) => (
                  <tr key={d.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{d.title}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{d.client_name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/deliverables/${d.id}`} className="text-accent-blue hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Test in browser**

- Navigate to `http://localhost:3000/dashboard/deliverables`
- Verify stats card appears at top
- Verify status filter pills work
- Verify urgent checkbox filters deliverables
- Verify sort dropdown changes order
- Verify mobile/desktop views work

**Step 3: Commit**

```bash
git add components/DeliverablesList.tsx
git commit -m "feat: integrate stats, filters, and sorting into deliverables list"
```

---

## PHASE 2: Bulk Operations & Organization

### Task 4: Create bulk update API endpoint

**Files:**
- Create: `app/api/deliverables/bulk/route.ts`
- Modify: `lib/db-queries.ts` (add bulk update function)

**Step 1: Add bulk update function to db-queries.ts**

Add this function after `getDeliverablesFiltered`:

```typescript
/**
 * Update status for multiple deliverables in a single transaction
 * @param deliverableIds - Array of deliverable IDs to update
 * @param newStatus - New status value
 * @param agencyId - Agency ID (for security - verify ownership)
 * @returns Number of deliverables updated
 */
export async function updateDeliverablesBulk(
  deliverableIds: string[],
  newStatus: string,
  agencyId: string
): Promise<number> {
  if (deliverableIds.length === 0) return 0;

  // Verify all deliverables belong to this agency
  const checkQuery = `
    SELECT COUNT(*) as count FROM deliverables
    WHERE agency_id = $1 AND id = ANY($2)
  `;
  const checkResult = await db.query(checkQuery, [agencyId, deliverableIds]);
  const matchCount = parseInt(checkResult.rows[0].count, 10);

  if (matchCount !== deliverableIds.length) {
    throw new Error('Some deliverables do not belong to this agency');
  }

  // Update all at once
  const updateQuery = `
    UPDATE deliverables
    SET status = $1
    WHERE id = ANY($2) AND agency_id = $3
    RETURNING id
  `;
  const result = await db.query(updateQuery, [newStatus, deliverableIds, agencyId]);
  return result.rows.length;
}
```

**Step 2: Create bulk API route**

Create file `app/api/deliverables/bulk/route.ts`:

```typescript
import { auth } from '@/lib/auth';
import { updateDeliverablesBulk } from '@/lib/db-queries';

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return Response.json({ error: 'status is required' }, { status: 400 });
    }

    const updated = await updateDeliverablesBulk(ids, status, session.user.agencyId);

    return Response.json({ updated, total: ids.length });
  } catch (error) {
    console.error('Error in bulk update:', error);
    return Response.json(
      { error: 'Failed to update deliverables' },
      { status: 500 }
    );
  }
}
```

**Step 3: Test the endpoint**

```bash
# Test bulk update with curl
curl -X PATCH http://localhost:3000/api/deliverables/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2", "id3"],
    "status": "done"
  }'
```

Expected: Returns `{ "updated": 3, "total": 3 }`

**Step 4: Commit**

```bash
git add app/api/deliverables/bulk/route.ts lib/db-queries.ts
git commit -m "feat: add bulk update endpoint for deliverables"
```

---

### Task 5: Create DeliverableGroupedList component

**Files:**
- Create: `components/DeliverableGroupedList.tsx`

**Step 1: Create component**

```typescript
'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

interface Deliverable {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

interface DeliverableGroupedListProps {
  deliverables: Deliverable[];
  onBulkSelect?: (selectedIds: string[]) => void;
  bulkMode?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-bg-hover text-text-primary',
  in_review: 'bg-accent-blue/10 text-accent-blue',
  approved: 'bg-accent-green/10 text-accent-green',
  changes_requested: 'bg-accent-amber/10 text-accent-amber',
  done: 'bg-accent-purple/10 text-accent-purple',
};

export function DeliverableGroupedList({
  deliverables,
  onBulkSelect,
  bulkMode = false,
}: DeliverableGroupedListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Group by client_name
  const grouped: Record<string, Deliverable[]> = {};
  deliverables.forEach((d) => {
    const clientName = d.client_name || 'Ungrouped';
    if (!grouped[clientName]) grouped[clientName] = [];
    grouped[clientName].push(d);
  });

  const toggleGroup = (clientName: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpanded(newExpanded);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    onBulkSelect?.(Array.from(newSelected));
  };

  const selectAllInGroup = (clientName: string) => {
    const groupIds = grouped[clientName].map((d) => d.id);
    const newSelected = new Set(selected);
    const allSelected = groupIds.every((id) => newSelected.has(id));

    if (allSelected) {
      groupIds.forEach((id) => newSelected.delete(id));
    } else {
      groupIds.forEach((id) => newSelected.add(id));
    }

    setSelected(newSelected);
    onBulkSelect?.(Array.from(newSelected));
  };

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([clientName, items]) => {
        const isExpanded = expanded.has(clientName);
        const pending = items.filter(
          (d) => d.status !== 'done' && d.status !== 'approved'
        ).length;
        const done = items.filter((d) => d.status === 'done').length;
        const completionPercent = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
        const groupSelected = items.every((d) => selected.has(d.id));

        return (
          <div key={clientName} className="rounded-xl border border-border-default overflow-hidden bg-bg-secondary">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(clientName)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={groupSelected}
                    onChange={() => selectAllInGroup(clientName)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded"
                  />
                )}
                <div className="flex-1 text-left">
                  <p className="font-semibold text-text-primary">{clientName}</p>
                  <p className="text-xs text-text-tertiary">
                    {pending} pending · {done} done · {completionPercent}% complete
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-text-tertiary transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Group items */}
            {isExpanded && (
              <div className="border-t border-border-default divide-y divide-border-default">
                {items.map((d) => (
                  <Link
                    key={d.id}
                    href={`/dashboard/deliverables/${d.id}`}
                    className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-bg-hover transition-colors"
                    onClick={(e) => {
                      if (bulkMode && (e.target as HTMLElement).closest('input')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={selected.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{d.title}</p>
                        <p className="text-xs text-text-tertiary mt-0.5 truncate">
                          {d.month_year}
                          {d.due_date && ` · Due ${new Date(d.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Test component**

- Component renders groups correctly
- Groups expand/collapse on click
- Summary stats show pending/done percentages
- Mobile shows properly

**Step 3: Commit**

```bash
git add components/DeliverableGroupedList.tsx
git commit -m "feat: create grouped deliverables list component"
```

---

### Task 6: Add grouping toggle and bulk actions to DeliverablesList

**Files:**
- Modify: `components/DeliverablesList.tsx` (add grouping toggle, bulk actions, import grouped list)

**Step 1: Update DeliverablesList to support grouping and bulk actions**

Replace the entire DeliverablesList file with this enhanced version:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, X } from 'lucide-react';
import NewDeliverableModal from './NewDeliverableModal';
import { DeliverableStats } from './DeliverableStats';
import { DeliverableGroupedList } from './DeliverableGroupedList';

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

      // Optimistic update
      setDeliverables((prev) =>
        prev.map((d) =>
          selectedBulk.includes(d.id) ? { ...d, status: newStatus } : d
        )
      );

      setSelectedBulk([]);
      setBulkMode(false);
    } catch (err) {
      console.error('Bulk update error:', err);
      setError('Failed to update deliverables');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
        ))}
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
      {/* Stats widget */}
      <DeliverableStats deliverables={deliverables} />

      {/* Filters + Sort + New Deliverable */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize text-xs font-semibold transition-colors ${
                  statusFilter === status
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New Deliverable
          </button>
        </div>

        {/* Urgent filter + Sort + Group toggle + Bulk mode */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs font-medium text-text-secondary">Urgent (due within 7 days)</span>
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
      </div>

      {/* Bulk action bar */}
      {bulkMode && selectedBulk.length > 0 && (
        <div className="mb-4 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-accent-blue">{selectedBulk.length} items selected</span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus || ''}
              onChange={(e) => {
                setBulkStatus(e.target.value);
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs border border-border-default bg-white text-text-primary focus:border-border-active focus:outline-none"
            >
              <option value="">Change Status to...</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="done">Done</option>
            </select>
            {bulkLoading && <span className="text-xs text-accent-blue">Updating...</span>}
          </div>
        </div>
      )}

      <NewDeliverableModal isOpen={showModal} onClose={() => setShowModal(false)} onCreated={handleCreated} />

      {deliverables.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
          No deliverables{statusFilter !== 'all' ? ` with status "${statusFilter.replace('_', ' ')}"` : ''}.
        </div>
      ) : (
        <>
          {grouped ? (
            // Grouped view
            <DeliverableGroupedList
              deliverables={deliverables}
              bulkMode={bulkMode}
              onBulkSelect={setSelectedBulk}
            />
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden space-y-2">
                {deliverables.map((d) => (
                  <Link
                    key={d.id}
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
                          {d.client_name || '—'} · {d.month_year}
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
                ))}
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
                            checked={deliverables.every((d) => selectedBulk.includes(d.id))}
                            onChange={() => {
                              if (deliverables.every((d) => selectedBulk.includes(d.id))) {
                                setSelectedBulk([]);
                              } else {
                                setSelectedBulk(deliverables.map((d) => d.id));
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {deliverables.map((d) => (
                      <tr key={d.id} className="hover:bg-bg-hover transition-colors">
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
                        <td className="px-6 py-4 text-sm text-text-secondary">{d.client_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/dashboard/deliverables/${d.id}`} className="text-accent-blue hover:underline text-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
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

**Step 2: Test in browser**

- Toggle "Group by Client" and verify grouping works
- Click "Bulk Select" and verify checkboxes appear
- Select multiple items and change status via dropdown
- Verify status updates in real-time
- Test mobile and desktop views

**Step 3: Commit**

```bash
git add components/DeliverablesList.tsx
git commit -m "feat: add grouping toggle and bulk actions to deliverables list"
```

---

### Task 7: Create calendar view component

**Files:**
- Create: `components/DeliverableCalendar.tsx`
- Modify: `lib/db-queries.ts` (add calendar query)

**Step 1: Add calendar query to db-queries.ts**

```typescript
/**
 * Get deliverables aggregated by month and status for calendar view
 * @param agencyId - Agency ID
 * @returns Array of {month_year, status, count}
 */
export async function getDeliverablesCalendarData(agencyId: string): Promise<Array<{month_year: string; status: string; count: number}>> {
  const query = `
    SELECT month_year, status, COUNT(*) as count
    FROM deliverables
    WHERE agency_id = $1
    GROUP BY month_year, status
    ORDER BY month_year DESC
  `;
  const result = await db.query(query, [agencyId]);
  return result.rows;
}
```

**Step 2: Create calendar component**

```typescript
'use client';

interface DeliverableCalendarProps {
  deliverables: Array<{
    id: string;
    month_year: string;
    status: string;
  }>;
  onMonthSelect?: (monthYear: string) => void;
}

export function DeliverableCalendar({
  deliverables,
  onMonthSelect,
}: DeliverableCalendarProps) {
  // Aggregate by month + status
  const data: Record<string, Record<string, number>> = {};
  const allStatuses = ['draft', 'in_review', 'approved', 'changes_requested', 'done'];

  deliverables.forEach((d) => {
    if (!data[d.month_year]) {
      data[d.month_year] = {
        draft: 0,
        in_review: 0,
        approved: 0,
        changes_requested: 0,
        done: 0,
      };
    }
    data[d.month_year][d.status] = (data[d.month_year][d.status] || 0) + 1;
  });

  // Get all months, sorted
  const months = Object.keys(data).sort().reverse();
  const currentYearMonths = months.filter((m) => m.startsWith(new Date().getFullYear().toString()));

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-bg-hover',
    in_review: 'bg-accent-blue/10 text-accent-blue',
    approved: 'bg-accent-green/10 text-accent-green',
    changes_requested: 'bg-accent-amber/10 text-accent-amber',
    done: 'bg-accent-purple/10 text-accent-purple',
  };

  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary overflow-x-auto">
      <table className="w-full">
        <thead className="bg-bg-tertiary border-b border-border-default">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Status
            </th>
            {currentYearMonths.map((month) => {
              const [year, monthNum] = month.split('-');
              const date = new Date(parseInt(year), parseInt(monthNum) - 1);
              const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              return (
                <th key={month} className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {allStatuses.map((status) => (
            <tr key={status} className="hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-text-primary capitalize">
                {status.replace('_', ' ')}
              </td>
              {currentYearMonths.map((month) => {
                const count = data[month]?.[status] || 0;
                return (
                  <td
                    key={`${month}-${status}`}
                    className={`px-4 py-3 text-center text-sm font-medium cursor-pointer transition-all ${
                      count > 0
                        ? `${STATUS_COLORS[status]} hover:opacity-80`
                        : 'text-text-tertiary'
                    }`}
                    onClick={() => count > 0 && onMonthSelect?.(month)}
                  >
                    {count > 0 ? count : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="font-semibold bg-bg-tertiary">
            <td className="px-4 py-3 text-sm text-text-primary">Total</td>
            {currentYearMonths.map((month) => {
              const total = Object.values(data[month] || {}).reduce((a, b) => a + b, 0);
              const done = data[month]?.done || 0;
              const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <td key={`${month}-total`} className="px-4 py-3 text-center text-sm text-text-primary">
                  {total} ({completionPercent}%)
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

**Step 3: Add tab toggle to DeliverablesList**

In `components/DeliverablesList.tsx`, add this state and UI:

Add state:
```typescript
const [view, setView] = useState<'list' | 'calendar'>('list');
```

Add tab buttons before the list/grouped view:
```typescript
{/* View toggle */}
<div className="mb-5 flex gap-2">
  <button
    onClick={() => setView('list')}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      view === 'list'
        ? 'bg-accent-blue text-white'
        : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
    }`}
  >
    List
  </button>
  <button
    onClick={() => setView('calendar')}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      view === 'calendar'
        ? 'bg-accent-blue text-white'
        : 'bg-bg-secondary text-text-secondary border border-border-default hover:bg-bg-hover'
    }`}
  >
    Calendar
  </button>
</div>

{/* Calendar view */}
{view === 'calendar' && (
  <DeliverableCalendar
    deliverables={deliverables}
    onMonthSelect={(month) => {
      // You could filter to this month, or just show in calendar
    }}
  />
)}
```

**Step 4: Test in browser**

- Click "Calendar" tab
- Verify calendar shows months and status rows
- Verify counts are correct
- Verify completion % calculations are correct

**Step 5: Commit**

```bash
git add components/DeliverableCalendar.tsx lib/db-queries.ts components/DeliverablesList.tsx
git commit -m "feat: add calendar view for deliverables by month and status"
```

---

## PHASE 3: Collaboration & External Access

### Task 8: Add portal_token to clients table and generate tokens

**Files:**
- Modify: `lib/db-queries.ts` (add token generation function)
- Modify: `lib/db.ts` or migration file

**Step 1: Create database migration**

Run this SQL against your database:

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token VARCHAR(255) UNIQUE;

-- Generate tokens for existing clients that don't have one
UPDATE clients
SET portal_token = encode(gen_random_bytes(16), 'hex')
WHERE portal_token IS NULL;
```

**Step 2: Add token generation function to db-queries.ts**

```typescript
import crypto from 'crypto';

/**
 * Generate a random 32-character token for client portal access
 */
export function generatePortalToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Update client with a new portal token
 */
export async function setClientPortalToken(clientId: string, agencyId: string): Promise<string> {
  const token = generatePortalToken();
  const query = `
    UPDATE clients SET portal_token = $1
    WHERE id = $2 AND agency_id = $3
    RETURNING portal_token
  `;
  const result = await db.query(query, [token, clientId, agencyId]);
  if (result.rows.length === 0) throw new Error('Client not found');
  return token;
}

/**
 * Get client by portal token (public, no agency check)
 */
export async function getClientByPortalToken(token: string): Promise<any> {
  const query = `
    SELECT id, name, email, agency_id
    FROM clients
    WHERE portal_token = $1
  `;
  const result = await db.query(query, [token]);
  return result.rows[0] || null;
}
```

**Step 3: Test**

Run query to verify token was added:
```sql
SELECT id, name, portal_token FROM clients LIMIT 5;
```

**Step 4: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add portal token support to clients table"
```

---

### Task 9: Create client portal page

**Files:**
- Create: `app/client-portal/[token]/page.tsx`
- Create: `components/ClientPortalView.tsx`

**Step 1: Create client portal view component**

Create `components/ClientPortalView.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

interface Deliverable {
  id: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

interface ClientPortalViewProps {
  clientName: string;
  token: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-hover text-text-primary',
  in_review: 'bg-accent-blue/10 text-accent-blue',
  approved: 'bg-accent-green/10 text-accent-green',
  changes_requested: 'bg-accent-amber/10 text-accent-amber',
  done: 'bg-accent-purple/10 text-accent-purple',
};

export function ClientPortalView({ clientName, token }: ClientPortalViewProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const res = await fetch(`/api/client-portal/${token}`);
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
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-bg-secondary border border-border-default animate-pulse"
          />
        ))}
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

  const done = deliverables.filter((d) => d.status === 'done').length;
  const completionPercent = deliverables.length > 0
    ? Math.round((done / deliverables.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border-default bg-bg-secondary py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{clientName}</h1>
              <p className="text-sm text-text-tertiary mt-1">Deliverables Progress</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-accent-green">{completionPercent}%</p>
              <p className="text-xs text-text-tertiary mt-1">Complete</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {deliverables.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
            No deliverables yet
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                  Total
                </p>
                <p className="text-2xl font-bold text-text-primary">{deliverables.length}</p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-accent-blue">
                  {deliverables.filter((d) => d.status !== 'done' && d.status !== 'approved').length}
                </p>
              </div>
              <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                  Completed
                </p>
                <p className="text-2xl font-bold text-accent-green">{done}</p>
              </div>
            </div>

            {/* List */}
            <div className="hidden sm:block bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-tertiary border-b border-border-default">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {deliverables.map((d) => (
                    <tr key={d.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">{d.title}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-bg-hover text-text-primary'}`}>
                          {d.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden space-y-2">
              {deliverables.map((d) => (
                <div
                  key={d.id}
                  className="p-4 bg-bg-secondary rounded-xl border border-border-default"
                >
                  <p className="font-medium text-text-primary">{d.title}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {d.month_year}
                    {d.due_date && ` · Due ${new Date(d.due_date).toLocaleDateString()}`}
                  </p>
                  <div className="mt-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-bg-hover text-text-primary'}`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-default bg-bg-secondary mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-text-tertiary">
          <p>Powered by Agency OS</p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Create portal page**

Create `app/client-portal/[token]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { getClientByPortalToken } from '@/lib/db-queries';
import { ClientPortalView } from '@/components/ClientPortalView';

export default async function ClientPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const client = await getClientByPortalToken(params.token);

  if (!client) {
    notFound();
  }

  return <ClientPortalView clientName={client.name} token={params.token} />;
}
```

**Step 3: Test locally**

- Navigate to `http://localhost:3000/client-portal/[valid-token]`
- Verify client name shows
- Verify deliverables load
- Verify completion % is correct
- Test invalid token → 404

**Step 4: Commit**

```bash
git add app/client-portal/[token]/page.tsx components/ClientPortalView.tsx
git commit -m "feat: create read-only client portal"
```

---

### Task 10: Create client portal API endpoint

**Files:**
- Create: `app/api/client-portal/[token]/route.ts`
- Modify: `lib/db-queries.ts` (add get deliverables by client query)

**Step 1: Add query to db-queries.ts**

```typescript
/**
 * Get deliverables for a client (used by public portal)
 * No agency check - token is the auth mechanism
 */
export async function getDeliverablesByClient(clientId: string): Promise<any[]> {
  const query = `
    SELECT id, title, status, month_year, due_date
    FROM deliverables
    WHERE client_id = $1
    ORDER BY due_date ASC NULLS LAST, month_year DESC
  `;
  const result = await db.query(query, [clientId]);
  return result.rows;
}
```

**Step 2: Create API route**

Create `app/api/client-portal/[token]/route.ts`:

```typescript
import { getClientByPortalToken, getDeliverablesByClient } from '@/lib/db-queries';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const client = await getClientByPortalToken(params.token);

    if (!client) {
      return Response.json({ error: 'Invalid token' }, { status: 404 });
    }

    const deliverables = await getDeliverablesByClient(client.id);
    return Response.json(deliverables);
  } catch (error) {
    console.error('Error fetching client portal data:', error);
    return Response.json({ error: 'Failed to fetch deliverables' }, { status: 500 });
  }
}
```

**Step 3: Test**

```bash
curl http://localhost:3000/api/client-portal/[valid-token]
```

Expected: Returns JSON array of deliverables for that client

**Step 4: Commit**

```bash
git add app/api/client-portal/[token]/route.ts lib/db-queries.ts
git commit -m "feat: add client portal API endpoint"
```

---

### Task 11: Add email notification for revision requests

**Files:**
- Create: `lib/send-deliverable-notification.ts`
- Modify: `components/DeliverableDetail.tsx` (trigger notification)
- Modify: `app/api/deliverables/[id]/comments/route.ts` (trigger notification)

**Step 1: Create email notification function**

Create `lib/send-deliverable-notification.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface RevisionRequestEmailProps {
  clientEmail: string;
  clientName: string;
  deliverableTitle: string;
  revisionComment: string;
  portalLink: string;
  agencyName: string;
}

export async function sendRevisionRequestEmail({
  clientEmail,
  clientName,
  deliverableTitle,
  revisionComment,
  portalLink,
  agencyName,
}: RevisionRequestEmailProps) {
  const truncatedComment = revisionComment.substring(0, 150);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f6f7f9;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1a202c;
            font-size: 24px;
            margin: 0 0 16px 0;
          }
          p {
            color: #4a5568;
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          .highlight {
            background: #f0f4f8;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
          }
          .footer {
            color: #718096;
            font-size: 12px;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Revision Request: ${deliverableTitle}</h1>
          <p>Hi ${clientName},</p>
          <p>${agencyName} has requested revisions on your deliverable <strong>"${deliverableTitle}"</strong>.</p>

          <div class="highlight">
            <strong>Feedback:</strong><br/>
            ${truncatedComment}${revisionComment.length > 150 ? '...' : ''}
          </div>

          <p>Please review the full details and feedback in your project portal:</p>

          <a href="${portalLink}" class="cta-button">View Deliverable</a>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${agencyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'notifications@agencyos.com',
      to: clientEmail,
      subject: `Revision Request: ${deliverableTitle}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send revision request email:', error);
    // Don't throw - notifications should not block the main flow
  }
}
```

**Step 2: Update comment POST endpoint**

Modify `app/api/deliverables/[id]/comments/route.ts`:

```typescript
import { auth } from '@/lib/auth';
import { getDeliverableById, createDeliverableComment } from '@/lib/db-queries';
import { sendRevisionRequestEmail } from '@/lib/send-deliverable-notification';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.agencyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { comment, isRevisionRequest } = body;

    if (!comment || typeof comment !== 'string') {
      return Response.json({ error: 'comment is required' }, { status: 400 });
    }

    // Get deliverable to verify ownership
    const deliverable = await getDeliverableById(params.id, session.user.agencyId);
    if (!deliverable) {
      return Response.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    // Create comment
    const newComment = await createDeliverableComment({
      deliverableId: params.id,
      userId: session.user.id,
      comment,
      isRevisionRequest: isRevisionRequest || false,
    });

    // If revision request, send email to client
    if (isRevisionRequest) {
      const client = await db.query(
        `SELECT email, name FROM clients WHERE id = $1`,
        [deliverable.client_id]
      );

      if (client.rows.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const portalLink = `${baseUrl}/client-portal/${deliverable.portal_token || ''}`;

        await sendRevisionRequestEmail({
          clientEmail: client.rows[0].email,
          clientName: client.rows[0].name,
          deliverableTitle: deliverable.title,
          revisionComment: comment,
          portalLink,
          agencyName: session.user.agencyName || 'Your Agency',
        });
      }
    }

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
```

**Step 3: Update DeliverableDetail component**

In `components/DeliverableDetail.tsx`, after `handleAddComment`:

```typescript
const handleAddComment = async () => {
  const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: newComment, isRevisionRequest }),
  });

  if (res.ok) {
    // Show success toast (you may already have one)
    console.log(isRevisionRequest ? 'Revision request sent to client' : 'Comment posted');

    setNewComment('');
    setIsRevisionRequest(false);
    router.refresh();
  }
};
```

**Step 4: Test**

- Navigate to deliverable detail
- Post comment + check "Revision Request"
- Click "Post"
- Check email inbox (or MailHog at localhost:8025)
- Verify email arrived with comment excerpt and portal link

**Step 5: Commit**

```bash
git add lib/send-deliverable-notification.ts app/api/deliverables/[id]/comments/route.ts components/DeliverableDetail.tsx
git commit -m "feat: add revision request email notifications"
```

---

## Final Testing Checklist

- [ ] Phase 1: Stats show, filters work, sorting works
- [ ] Phase 2: Grouping toggle works, bulk select/update works, calendar displays correctly
- [ ] Phase 3: Client portal loads with token, revision emails send, portal shows deliverables
- [ ] Mobile: All views responsive, no broken layouts
- [ ] API: All endpoints return correct data with proper auth
- [ ] Database: No errors in logs, data persists correctly

---

## Git Summary

Total commits: 11
- Task 1: API filtering
- Task 2: Stats component
- Task 3: List integration
- Task 4: Bulk update
- Task 5: Grouped list
- Task 6: Bulk UI
- Task 7: Calendar view
- Task 8: Portal token setup
- Task 9: Client portal page
- Task 10: Portal API
- Task 11: Email notifications

---

**Status:** Implementation plan complete and ready for execution.
