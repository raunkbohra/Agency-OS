'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
