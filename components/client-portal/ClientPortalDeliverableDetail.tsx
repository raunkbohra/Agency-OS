'use client';

import { useEffect, useState } from 'react';
import { FileText, MessageSquare, Calendar, CheckCircle2, ListChecks } from 'lucide-react';

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

interface DeliverableItemType {
  id: string;
  title: string;
  status: string;
  sort_order: number;
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
  const [items, setItems] = useState<DeliverableItemType[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [requestChanges, setRequestChanges] = useState(false);

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
        setItems(data.items || []);
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/client-portal/me/deliverables/${deliverableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment, isRevisionRequest: requestChanges }),
      });

      const data = await res.json();

      if (res.ok) {
        setComments([data, ...comments]);
        setNewComment('');
        setRequestChanges(false);
      } else {
        console.error('Failed to add comment:', data);
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
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

      {/* Items Checklist */}
      {items.length > 0 && (
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ListChecks size={18} style={{ color: 'var(--text-secondary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Items
            </h2>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginLeft: 'auto' }}>
              {items.filter(i => i.status === 'done' || i.status === 'approved').length}/{items.length} complete
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '9999px', marginBottom: '1rem', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(items.filter(i => i.status === 'done' || i.status === 'approved').length / items.length) * 100}%`,
                background: 'var(--accent-green)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div className="space-y-1">
            {items.map((item) => {
              const isDone = item.status === 'done' || item.status === 'approved';
              const statusColors: Record<string, string> = {
                draft: 'var(--text-tertiary)',
                in_review: 'var(--accent-blue)',
                approved: 'var(--accent-green)',
                changes_requested: 'var(--accent-amber)',
                done: 'var(--accent-purple)',
              };
              const color = statusColors[item.status] || 'var(--text-tertiary)';

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: isDone ? 'rgba(0,0,0,0.02)' : 'transparent' }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `2px solid ${isDone ? 'var(--accent-green)' : 'var(--border-default)'}`,
                      background: isDone ? 'var(--accent-green)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.875rem',
                      color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `${color}15`,
                      color: color,
                      textTransform: 'capitalize',
                    }}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
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
            Feedback & Comments
          </h2>
        </div>

        {/* Add Comment Form */}
        <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your feedback or request changes..."
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '0.75rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
            rows={3}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requestChanges}
                onChange={(e) => setRequestChanges(e.target.checked)}
                style={{ borderRadius: '0.25rem' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Request changes
              </span>
            </label>
            <button
              onClick={handleAddComment}
              disabled={submittingComment || !newComment.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: newComment.trim()
                  ? requestChanges ? 'var(--accent-amber)' : 'var(--accent-blue)'
                  : 'var(--text-tertiary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                opacity: submittingComment ? 0.7 : 1,
              }}
            >
              {submittingComment ? 'Sending...' : requestChanges ? 'Send Change Request' : 'Send Feedback'}
            </button>
          </div>
        </div>

        {/* Display Comments */}
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
                      Changes Requested
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
