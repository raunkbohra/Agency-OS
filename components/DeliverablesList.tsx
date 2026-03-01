'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

const STATUS_COLORS: Record<string, string> = {
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const res = await fetch('/api/deliverables');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDeliverables(data);
      } catch (err) {
        setError('Failed to load deliverables');
      } finally {
        setLoading(false);
      }
    };
    fetchDeliverables();
  }, []);

  const filtered = statusFilter === 'all'
    ? deliverables
    : deliverables.filter(d => d.status === statusFilter);

  if (loading) return <div className="text-text-tertiary">Loading deliverables...</div>;
  if (error) return <div className="text-accent-red">{error}</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded capitalize text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-accent-blue text-white'
                : 'bg-bg-hover text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">
          No deliverables found{statusFilter !== 'all' ? ` with status "${statusFilter.replace('_', ' ')}"` : ''}.
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-lg border border-border-default overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border-default">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Month</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-bg-hover">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{d.title}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{d.client_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-bg-hover text-text-primary'}`}>
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
      )}
    </div>
  );
}
