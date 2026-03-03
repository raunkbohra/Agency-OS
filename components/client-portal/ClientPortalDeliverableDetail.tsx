'use client';

import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Calendar, CheckCircle2 } from 'lucide-react';

interface File {
  id: string;
  file_name: string;
  file_url: string;
}

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  comment_text: string;
  is_revision_request: boolean;
  created_at: string;
}

interface Deliverable {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ClientPortalDeliverableDetailProps {
  deliverableId: string;
}

const statusConfig: Record<string, { badge: string; color: string }> = {
  pending: { badge: 'Pending', color: 'var(--accent-amber)' },
  in_progress: { badge: 'In Progress', color: 'var(--accent-blue)' },
  in_review: { badge: 'In Review', color: 'var(--accent-purple)' },
  approved: { badge: 'Approved', color: 'var(--accent-green)' },
  rejected: { badge: 'Rejected', color: 'var(--accent-red)' },
};

export default function ClientPortalDeliverableDetail({
  deliverableId,
}: ClientPortalDeliverableDetailProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/client-portal/me/deliverables/${deliverableId}`);

        if (!res.ok) {
          if (res.status === 401) {
            setError('Unauthorized');
          } else if (res.status === 404) {
            setError('Deliverable not found');
          } else {
            setError('Failed to load deliverable');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setDeliverable(data.deliverable);
        setFiles(data.files || []);
        setComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching deliverable:', err);
        setError('Failed to load deliverable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deliverableId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4"
            viewBox="0 0 24 24"
            style={{ color: 'var(--accent-blue)' }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading deliverable...</p>
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

  if (!deliverable) {
    return (
      <div
        className="p-4 rounded-lg border text-sm"
        style={{
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          color: 'var(--accent-red)',
        }}
      >
        Deliverable not found
      </div>
    );
  }

  const statusInfo = statusConfig[deliverable.status] || statusConfig.pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '1.5rem' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {deliverable.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Created {formatDateTime(deliverable.created_at)}
            </p>
          </div>
          <div
            className="px-4 py-2 rounded-lg font-medium"
            style={{
              background: `${statusInfo.color}15`,
              border: `1px solid ${statusInfo.color}30`,
              color: statusInfo.color,
            }}
          >
            {statusInfo.badge}
          </div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Due Date</p>
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatDate(deliverable.due_date)}
          </p>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Status</p>
          </div>
          <p
            className="text-lg font-semibold"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.badge}
          </p>
        </div>
      </div>

      {/* Description */}
      {deliverable.description && (
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Description
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {deliverable.description}
          </p>
        </div>
      )}

      {/* Files */}
      <div
        className="p-4 rounded-lg border"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Files & Attachments
          </h2>
        </div>

        {files.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No files attached yet
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <a
                key={file.id}
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                style={{
                  background: 'rgba(74, 98, 120, 0.05)',
                  border: '1px solid var(--border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 98, 120, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 98, 120, 0.05)';
                }}
              >
                <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {file.file_name}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div
        className="p-4 rounded-lg border"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} style={{ color: 'var(--text-secondary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Comments & Updates
          </h2>
        </div>

        {comments.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            No comments yet
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 rounded-lg"
                style={{
                  background: comment.is_revision_request
                    ? 'rgba(255, 152, 0, 0.05)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {comment.author_name}
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {formatDateTime(comment.created_at)}
                    </p>
                  </div>
                  {comment.is_revision_request && (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'rgba(255, 152, 0, 0.15)',
                        color: 'var(--accent-amber)',
                      }}
                    >
                      Revision Request
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {comment.comment_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
