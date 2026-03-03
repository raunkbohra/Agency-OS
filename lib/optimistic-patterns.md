# Optimistic Update Patterns

This document describes the patterns for implementing optimistic updates using React 19's `useOptimistic` hook.

## Pattern 1: Optimistic Delete

```tsx
'use client';

import { useOptimistic } from 'react';

function DeliverablesList({ deliverables }: { deliverables: Deliverable[] }) {
  const [optimisticDeliverables, removeOptimistic] = useOptimistic(
    deliverables,
    (state, id: string) => state.filter(item => item.id !== id)
  );

  async function handleDelete(id: string) {
    // Remove from UI immediately
    removeOptimistic(id);

    try {
      // Make server request
      const res = await fetch(`/api/deliverables/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    } catch (error) {
      // On error, React automatically reverts the optimistic change
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  return (
    <div>
      {optimisticDeliverables.map(item => (
        <div key={item.id}>
          {item.title}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Pattern 2: Optimistic Status Change

```tsx
'use client';

import { useOptimistic } from 'react';

function DeliverablesList({ deliverables }: { deliverables: Deliverable[] }) {
  const [optimisticDeliverables, updateOptimistic] = useOptimistic(
    deliverables,
    (state, { id, status }: { id: string; status: string }) =>
      state.map(item => item.id === id ? { ...item, status } : item)
  );

  async function handleStatusChange(id: string, newStatus: string) {
    // Update UI immediately
    updateOptimistic({ id, status: newStatus });

    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      // React automatically reverts on error
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  }

  return (
    <div>
      {optimisticDeliverables.map(item => (
        <select
          value={item.status}
          onChange={e => handleStatusChange(item.id, e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="done">Done</option>
        </select>
      ))}
    </div>
  );
}
```

## Components with Existing Optimistic Updates

- `DeliverablesList.tsx` - Bulk status updates (manual)
- `PlanEditor.tsx` - Delete plan items (manual)

## Components Needing useOptimistic Implementation

- `DeliverablesList.tsx` - Status changes, individual deletes
- `ContractsList.tsx` - Delete operations
- `ClientDeliverablesList.tsx` - Status changes

## Key Benefits of useOptimistic

1. **Automatic Rollback**: On error, React automatically reverts to server state
2. **Cleaner Code**: No need to manage separate loading/error states
3. **Better UX**: UI updates immediately while server request is in flight
4. **Type Safe**: Full TypeScript support
