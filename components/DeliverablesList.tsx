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
  draft: 'bg-gray-100 text-gray-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  changes_requested: 'bg-yellow-100 text-yellow-800',
  done: 'bg-purple-100 text-purple-800',
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

  if (loading) return <div className="text-gray-500">Loading deliverables...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded capitalize text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No deliverables found{statusFilter !== 'all' ? ` with status "${statusFilter.replace('_', ' ')}"` : ''}.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.client_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.month_year}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/deliverables/${d.id}`} className="text-blue-600 hover:underline text-sm">
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
