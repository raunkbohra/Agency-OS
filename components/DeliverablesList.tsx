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
  item_count?: number;
  items_completed?: number;
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

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-64 rounded bg-bg-secondary animate-pulse" />
        <div className="h-10 rounded-xl bg-bg-secondary animate-pulse" />
        <div className="h-8 w-3/4 rounded-lg bg-bg-secondary animate-pulse" />
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

      {/* Controls row */}
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
                              {d.client_name || '\u2014'} &middot; {d.month_year}
                              {d.item_count ? ` · ${d.items_completed ?? 0}/${d.item_count} items` : ''}
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Items</th>
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
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {d.item_count ? `${d.items_completed ?? 0}/${d.item_count}` : '\u2014'}
                          </td>
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
