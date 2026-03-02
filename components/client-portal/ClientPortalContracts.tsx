'use client';

import { useEffect, useState } from 'react';
import { FileCheck, ExternalLink, PenTool } from 'lucide-react';

interface Contract {
  id: string;
  fileName: string;
  fileUrl: string;
  signed: boolean;
  signingUrl: string | null;
  createdAt: string;
}

export default function ClientPortalContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await fetch('/api/client-portal/me/contracts');
        if (!res.ok) {
          throw new Error('Failed to fetch contracts');
        }
        const data = await res.json();
        setContracts(data.contracts || []);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading contracts...</p>
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

  if (!contracts.length) {
    return (
      <div className="text-center py-12">
        <FileCheck size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 1rem' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No contracts yet
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Contracts will appear here once they are uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contracts.map((contract) => (
        <div
          key={contract.id}
          className="rounded-lg border p-4 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(107, 126, 147, 0.1)' }}
              >
                <FileCheck size={20} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {contract.fileName}
                </h3>
              </div>
            </div>
            {contract.signed ? (
              <div
                className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                  background: 'rgba(0, 200, 83, 0.1)',
                  color: 'var(--accent-green)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-green)' }} />
                Signed
              </div>
            ) : (
              <div
                className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                  background: 'rgba(255, 179, 0, 0.1)',
                  color: 'var(--accent-amber)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-amber)' }} />
                Pending
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mb-4">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Created {formatDate(contract.createdAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.open(contract.fileUrl, '_blank');
              }}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background: 'rgba(107, 126, 147, 0.1)',
                color: 'var(--accent-blue)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(107, 126, 147, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(107, 126, 147, 0.1)';
              }}
            >
              <ExternalLink size={14} />
              View
            </button>
            {!contract.signed && (
              <button
                onClick={() => {
                  if (contract.signingUrl) {
                    window.open(contract.signingUrl, '_blank');
                  }
                }}
                disabled={!contract.signingUrl}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-white"
                style={{
                  background: contract.signingUrl ? 'var(--accent-blue)' : 'rgba(107, 126, 147, 0.3)',
                  cursor: contract.signingUrl ? 'pointer' : 'not-allowed',
                  opacity: contract.signingUrl ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (contract.signingUrl) {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (contract.signingUrl) {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }
                }}
              >
                <PenTool size={14} />
                Sign
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
