'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { badge: string; color: string }> = {
  pending: { badge: 'badge badge-warning', color: 'var(--accent-amber)' },
  in_progress: { badge: 'badge badge-info', color: 'var(--accent-blue)' },
  in_review: { badge: 'badge badge-info', color: 'var(--accent-purple)' },
  approved: { badge: 'badge badge-success', color: 'var(--accent-green)' },
  rejected: { badge: 'badge badge-error', color: 'var(--accent-red)' },
};

export default function ClientPortalDeliverables() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const res = await fetch('/api/client-portal/me/deliverables');
        if (!res.ok) {
          throw new Error('Failed to fetch deliverables');
        }
        const data = await res.json();
        setDeliverables(data.deliverables || []);
      } catch (err) {
        console.error('Error fetching deliverables:', err);
        setError('Failed to load deliverables');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliverables();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    return config.badge;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading deliverables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg border text-sm"
        style={{
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          color: 'var(--accent-red)',
        }}
      >
        {error}
      </div>
    );
  }

  if (!deliverables.length) {
    return (
      <div className="text-center py-12">
        <Package size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No deliverables yet
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Deliverables will appear here once they are assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Title
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Status
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Due Date
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {deliverables.map((deliverable, index) => (
            <tr
              key={deliverable.id}
              style={{
                borderBottom: '1px solid var(--border-default)',
                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                <p className="font-medium text-sm">{deliverable.title}</p>
              </td>
              <td className="px-4 py-3">
                <span className={getStatusBadge(deliverable.status)}>
                  {deliverable.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(deliverable.dueDate)}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(deliverable.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
