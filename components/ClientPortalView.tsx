'use client';

import { useMemo } from 'react';

interface Deliverable {
  id: string;
  title: string;
  status: string;
  month_year: string;
  due_date: string | null;
}

interface ClientPortalViewProps {
  clientName: string;
  deliverables: Deliverable[];
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-bg-hover text-text-primary',
  in_review: 'bg-accent-blue/10 text-accent-blue',
  approved: 'bg-accent-green/10 text-accent-green',
  changes_requested: 'bg-accent-amber/10 text-accent-amber',
  done: 'bg-accent-purple/10 text-accent-purple',
};

export default function ClientPortalView({ clientName, deliverables }: ClientPortalViewProps) {
  const stats = useMemo(() => {
    const total = deliverables.length;
    const done = deliverables.filter(d => d.status === 'done').length;
    const pending = deliverables.filter(d => d.status !== 'done' && d.status !== 'approved').length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, pending, completion };
  }, [deliverables]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome, {clientName}</h1>
          <p className="text-text-secondary">Your project deliverables and progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-xs font-medium text-text-tertiary uppercase">Total</p>
            <p className="text-2xl font-bold text-text-primary mt-2">{stats.total}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-xs font-medium text-text-tertiary uppercase">Completed</p>
            <p className="text-2xl font-bold text-accent-green mt-2">{stats.done}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-xs font-medium text-text-tertiary uppercase">Pending</p>
            <p className="text-2xl font-bold text-accent-amber mt-2">{stats.pending}</p>
          </div>
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
            <p className="text-xs font-medium text-text-tertiary uppercase">Progress</p>
            <p className="text-2xl font-bold text-accent-blue mt-2">{stats.completion}%</p>
          </div>
        </div>

        {/* Deliverables list */}
        {deliverables.length === 0 ? (
          <div className="bg-bg-secondary rounded-xl border border-border-default p-8 text-center">
            <p className="text-text-secondary">No deliverables to display</p>
          </div>
        ) : (
          <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-default">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {deliverables.map(d => (
                  <tr key={d.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">{d.title}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{d.month_year}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[d.status] || 'bg-bg-hover text-text-primary'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-text-tertiary">
          <p>This is a read-only view of your project deliverables.</p>
        </div>
      </div>
    </div>
  );
}
