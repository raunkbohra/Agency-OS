'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string | null;
  paidDate: string | null;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { badge: string; color: string }> = {
  pending: { badge: 'badge badge-warning', color: 'var(--accent-amber)' },
  paid: { badge: 'badge badge-success', color: 'var(--accent-green)' },
  overdue: { badge: 'badge badge-error', color: 'var(--accent-red)' },
  draft: { badge: 'badge badge-info', color: 'var(--accent-blue)' },
};

export default function ClientPortalInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/client-portal/me/invoices');
        if (!res.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await res.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: 'Rs.',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading invoices...</p>
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

  if (!invoices.length) {
    return (
      <div className="text-center py-12">
        <FileText size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No invoices yet
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Invoices will appear here once they are generated.
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
              Invoice
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Amount
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Due Date
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Paid Date
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Status
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => (
            <tr
              key={invoice.id}
              style={{
                borderBottom: '1px solid var(--border-default)',
                background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
              </td>
              <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(invoice.amount, invoice.currency)}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(invoice.dueDate)}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(invoice.paidDate)}
              </td>
              <td className="px-4 py-3">
                <span className={getStatusBadge(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: 'var(--accent-blue)',
                    background: 'rgba(107, 126, 147, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 126, 147, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 126, 147, 0.1)';
                  }}
                >
                  <Download size={14} />
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
