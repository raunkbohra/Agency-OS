'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import NewDeliverableModal from './NewDeliverableModal';
import DeliverableStats from './DeliverableStats';

interface Deliverable {
  id: string;
  client_id: string;
  client_name?: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

const STATUS_OPTIONS = ['all', 'draft', 'in_review', 'approved', 'changes_requested', 'done'];

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
    // Prepend the new deliverable with a placeholder client_name
    // The full client_name will show on next fetch; for now use what we have
    setDeliverables(prev => [{ ...deliverable, client_name: deliverable.client_name ?? '' }, ...prev]);
  };

  const sortOptions = [
    { value: 'due_date', label: 'Due Date (Earliest)' },
    { value: 'due_date_desc', label: 'Due Date (Latest)' },
    { value: 'client', label: 'By Client' },
    { value: 'status', label: 'By Status' },
  ];

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <div className="text-accent-red text-sm p-4 rounded-lg bg-accent-red/10 border border-accent-red/20">{error}</div>;

  return (
    <div>
      {/* Status filter pills + New Deliverable button */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(status => (
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

      <NewDeliverableModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />

      {/* Stats widget */}
      <DeliverableStats deliverables={deliverables} />

      {/* Urgent filter + Sort dropdown */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default cursor-pointer hover:bg-bg-hover transition-colors">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="h-4 w-4 rounded cursor-pointer"
          />
          <span className="text-xs font-medium text-text-primary">Urgent (due within 7 days)</span>
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default text-text-primary text-xs font-medium hover:bg-bg-hover transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
          No deliverables{statusFilter !== 'all' ? ` with status "${statusFilter.replace(/_/g, ' ')}"` : ''} found.
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {deliverables.map(d => (
              <Link
                key={d.id}
                href={`/dashboard/deliverables/${d.id}`}
                className="flex items-start justify-between gap-3 p-4 bg-bg-secondary rounded-xl border border-border-default hover:border-border-hover hover:bg-bg-hover transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{d.title}</p>
                  <p className="text-xs text-text-tertiary mt-0.5 truncate">{d.client_name || '—'} · {d.month_year}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {deliverables.map(d => (
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
                      <Link href={`/dashboard/deliverables/${d.id}`} className="text-accent-blue hover:underline text-sm">View</Link>
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
