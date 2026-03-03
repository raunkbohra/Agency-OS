'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { DeliverableStatsBar } from './DeliverableStatsBar';

// DeliverableItem reflects the API response shape: dates are strings, client_name is joined.
interface DeliverableItem {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
  item_count?: number;
  items_completed?: number;
}

interface DeliverableGroupedListProps {
  deliverables: DeliverableItem[];
  bulkMode?: boolean;
  // onBulkSelect: name used by the consumer (DeliverablesList.tsx)
  onBulkSelect?: (selectedIds: string[]) => void;
  // onSelectChange: name specified in the task requirements
  onSelectChange?: (selectedIds: string[]) => void;
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
  bulkMode = false,
  onBulkSelect,
  onSelectChange,
}: DeliverableGroupedListProps) {
  // Group deliverables by client_name
  const grouped = useMemo(() => {
    const map: Record<string, DeliverableItem[]> = {};
    deliverables.forEach((d) => {
      const key = d.client_name || 'Ungrouped';
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [deliverables]);

  // All groups start expanded
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(Object.keys(grouped))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Notify both callbacks with the latest selection
  const notifySelection = useCallback(
    (newSelected: Set<string>) => {
      const ids = Array.from(newSelected);
      onBulkSelect?.(ids);
      onSelectChange?.(ids);
    },
    [onBulkSelect, onSelectChange]
  );

  const toggleGroup = useCallback((clientName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        notifySelection(next);
        return next;
      });
    },
    [notifySelection]
  );

  const selectAllInGroup = useCallback(
    (clientName: string) => {
      const groupIds = (grouped[clientName] ?? []).map((d) => d.id);
      setSelected((prev) => {
        const next = new Set(prev);
        const allSelected = groupIds.every((id) => next.has(id));
        if (allSelected) {
          groupIds.forEach((id) => next.delete(id));
        } else {
          groupIds.forEach((id) => next.add(id));
        }
        notifySelection(next);
        return next;
      });
    },
    [grouped, notifySelection]
  );

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
        No deliverables to display.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([clientName, items]) => {
        const isExpanded = expanded.has(clientName);
        const groupSelected = items.every((d) => selected.has(d.id));

        return (
          <div
            key={clientName}
            className="rounded-xl border border-border-default overflow-hidden bg-bg-secondary"
          >
            {/* Group header — click to expand/collapse */}
            <button
              type="button"
              onClick={() => toggleGroup(clientName)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-hover transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={groupSelected}
                    onChange={() => selectAllInGroup(clientName)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded flex-shrink-0"
                  />
                )}
                <div className="text-left min-w-0">
                  <p className="font-semibold text-text-primary truncate">{clientName}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {items.length} {items.length === 1 ? 'deliverable' : 'deliverables'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-text-tertiary flex-shrink-0 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <>
                {/* Per-group stats using the shared DeliverableStats component */}
                <div className="px-4 py-3 border-t border-border-default bg-bg-tertiary">
                  <DeliverableStatsBar deliverables={items} />
                </div>

                {/* Individual items */}
                <div className="divide-y divide-border-default">
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
                            {d.item_count ? ` · ${d.items_completed ?? 0}/${d.item_count} items` : ''}
                            {d.due_date &&
                              ` · Due ${new Date(d.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'
                          }`}
                        >
                          {d.status.replace(/_/g, ' ')}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
