'use client';

import { useEffect, useState } from 'react';
import {
  FileText, MessageSquare, Calendar, CheckCircle2,
  ListChecks, ChevronRight, Paperclip, ExternalLink, Link2
} from 'lucide-react';

interface FileType {
  id: string;
  file_name: string;
  file_url: string;
  item_id?: string;
}

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  comment_text: string;
  is_revision_request: boolean;
  item_id?: string;
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
  draft: { badge: 'Draft', color: 'var(--text-tertiary)' },
  in_progress: { badge: 'In Progress', color: 'var(--accent-blue)' },
  in_review: { badge: 'In Review', color: 'var(--accent-purple)' },
  approved: { badge: 'Approved', color: 'var(--accent-green)' },
  changes_requested: { badge: 'Changes Requested', color: 'var(--accent-amber)' },
  done: { badge: 'Done', color: 'var(--accent-purple)' },
  rejected: { badge: 'Rejected', color: 'var(--accent-red)' },
};

export default function ClientPortalDeliverableDetail({
  deliverableId,
}: ClientPortalDeliverableDetailProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [files, setFiles] = useState<FileType[]>([]);
  const [items, setItems] = useState<DeliverableItemType[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Per-item active tab
  const [itemActiveTabs, setItemActiveTabs] = useState<Record<string, 'files' | 'comments'>>({});
  // Per-item comment states
  const [itemCommentTexts, setItemCommentTexts] = useState<Record<string, string>>({});
  const [itemRequestChanges, setItemRequestChanges] = useState<Record<string, boolean>>({});
  // Bundle-level
  const [bundleComment, setBundleComment] = useState('');
  const [bundleRequestChanges, setBundleRequestChanges] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/client-portal/me/deliverables/${deliverableId}`);
        if (!res.ok) {
          setError(res.status === 401 ? 'Unauthorized' : res.status === 404 ? 'Deliverable not found' : 'Failed to load deliverable');
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

  // Grouping
  const filesForItem = (itemId: string) => files.filter(f => f.item_id === itemId);
  const bundleFiles = files.filter(f => !f.item_id);
  const commentsForItem = (itemId: string) => comments.filter(c => c.item_id === itemId);
  const bundleComments = comments.filter(c => !c.item_id);

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getItemTab = (itemId: string) => itemActiveTabs[itemId] || 'files';
  const setItemTab = (itemId: string, tab: 'files' | 'comments') => {
    setItemActiveTabs(prev => ({ ...prev, [itemId]: tab }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleAddComment = async (itemId?: string) => {
    const commentText = itemId ? (itemCommentTexts[itemId] || '') : bundleComment;
    const isRequestChanges = itemId ? (itemRequestChanges[itemId] || false) : bundleRequestChanges;
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/client-portal/me/deliverables/${deliverableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText, isRevisionRequest: isRequestChanges, itemId: itemId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments([data, ...comments]);
        if (itemId) {
          setItemCommentTexts(prev => ({ ...prev, [itemId]: '' }));
          setItemRequestChanges(prev => ({ ...prev, [itemId]: false }));
        } else {
          setBundleComment('');
          setBundleRequestChanges(false);
        }
      } else {
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      alert('Error adding comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-9 w-64 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }} />
          ))}
        </div>
        <div className="h-48 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(255, 68, 68, 0.08)', border: '1px solid rgba(255, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
        {error}
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(255, 68, 68, 0.08)', border: '1px solid rgba(255, 68, 68, 0.2)', color: 'var(--accent-red)' }}>
        Deliverable not found
      </div>
    );
  }

  const statusInfo = statusConfig[deliverable.status] || statusConfig.pending;
  const completedItems = items.filter(i => i.status === 'done' || i.status === 'approved').length;

  // --- Render helpers ---

  const renderFileCard = (file: FileType) => (
    <a
      key={file.id}
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-150"
      style={{ background: 'rgba(107, 126, 147, 0.05)', border: '1px solid var(--border-default)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'rgba(107, 126, 147, 0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'rgba(107, 126, 147, 0.05)'; }}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8" style={{ borderRadius: '8px', background: 'rgba(107, 126, 147, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {file.file_url?.startsWith('http') ? (
          <Link2 size={13} style={{ color: 'var(--accent-blue)' }} />
        ) : (
          <FileText size={13} style={{ color: 'var(--accent-blue)' }} />
        )}
      </div>
      <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }}>
        {file.file_name}
      </span>
      <ExternalLink size={13} style={{ color: 'var(--text-quaternary)', flexShrink: 0 }} />
    </a>
  );

  const renderCommentThread = (commentList: Comment[], itemId?: string) => {
    const commentText = itemId ? (itemCommentTexts[itemId] || '') : bundleComment;
    const isRequestChanges = itemId ? (itemRequestChanges[itemId] || false) : bundleRequestChanges;

    return (
      <div>
        {/* Input */}
        <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ borderRadius: '0.5rem', border: '1px solid var(--border-default)', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <textarea
              value={commentText}
              onChange={(e) => {
                if (itemId) setItemCommentTexts(prev => ({ ...prev, [itemId]: e.target.value }));
                else setBundleComment(e.target.value);
              }}
              placeholder="Share your feedback..."
              style={{
                width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-tertiary)',
                border: 'none', color: 'var(--text-primary)', fontSize: '0.875rem',
                resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              }}
              rows={2}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
              padding: '0.5rem 0.75rem', background: 'rgba(10, 10, 10, 0.3)', borderTop: '1px solid var(--border-default)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', userSelect: 'none' as const }}>
                <input
                  type="checkbox"
                  checked={isRequestChanges}
                  onChange={(e) => {
                    if (itemId) setItemRequestChanges(prev => ({ ...prev, [itemId]: e.target.checked }));
                    else setBundleRequestChanges(e.target.checked);
                  }}
                  style={{ borderRadius: '0.25rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Request changes</span>
              </label>
              <button
                onClick={() => handleAddComment(itemId)}
                disabled={submittingComment || !commentText.trim()}
                style={{
                  padding: '0.25rem 0.75rem', border: 'none', borderRadius: '0.375rem',
                  fontSize: '0.75rem', fontWeight: 500, cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  background: commentText.trim()
                    ? isRequestChanges ? 'var(--accent-amber)' : 'var(--accent-blue)'
                    : 'var(--text-quaternary)',
                  color: 'white', opacity: submittingComment ? 0.7 : 1, transition: 'all 0.15s',
                }}
              >
                {submittingComment ? 'Sending...' : isRequestChanges ? 'Request Changes' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Thread */}
        {commentList.length === 0 ? (
          <p style={{ color: 'var(--text-quaternary)', fontSize: '0.8125rem', textAlign: 'center', padding: '0.5rem 0' }}>
            No comments yet
          </p>
        ) : (
          <div className="space-y-2">
            {commentList.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg px-3.5 py-3"
                style={{
                  background: comment.is_revision_request ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${comment.is_revision_request ? 'rgba(255, 152, 0, 0.15)' : 'var(--border-default)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {comment.author_name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-quaternary)' }}>
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {comment.comment_text}
                </p>
                {comment.is_revision_request && (
                  <div style={{
                    marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.125rem 0.5rem', borderRadius: '0.25rem',
                    background: 'rgba(255, 152, 0, 0.1)', color: 'var(--accent-amber)',
                    fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                  }}>
                    Changes Requested
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 truncate" style={{ color: 'var(--text-primary)' }}>
              {deliverable.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              Created {formatDateTime(deliverable.created_at)}
            </p>
          </div>
          <div
            className="px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium self-start flex-shrink-0"
            style={{
              background: `${statusInfo.color}12`,
              border: `1px solid ${statusInfo.color}25`,
              color: statusInfo.color,
            }}
          >
            {statusInfo.badge}
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Due Date</p>
          </div>
          <p className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(deliverable.due_date)}</p>
        </div>
        <div className="p-3 sm:p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <CheckCircle2 size={14} style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Status</p>
          </div>
          <p className="text-base sm:text-lg font-semibold" style={{ color: statusInfo.color }}>{statusInfo.badge}</p>
        </div>
      </div>

      {/* Description */}
      {deliverable.description && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Description</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{deliverable.description}</p>
        </div>
      )}

      {/* Items with expandable panels */}
      {items.length > 0 && (
        <div className="rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-3.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <ListChecks size={16} style={{ color: 'var(--text-secondary)' }} />
            <h2 className="text-xs sm:text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>Items</h2>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
              {completedItems}/{items.length} complete
            </span>
          </div>

          {/* Progress */}
          <div className="px-3 sm:px-4 pt-3">
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(completedItems / items.length) * 100}%`,
                background: 'var(--accent-green)', borderRadius: '9999px', transition: 'width 0.5s ease-out',
              }} />
            </div>
          </div>

          <div className="p-1 sm:p-2">
            {items.map((item) => {
              const isDone = item.status === 'done' || item.status === 'approved';
              const isExpanded = expandedItems.has(item.id);
              const itemFileList = filesForItem(item.id);
              const itemCommentList = commentsForItem(item.id);
              const fileCount = itemFileList.length;
              const commentCount = itemCommentList.length;
              const activeTab = getItemTab(item.id);
              const statusColors: Record<string, string> = {
                draft: 'var(--text-tertiary)', in_review: 'var(--accent-blue)',
                approved: 'var(--accent-green)', changes_requested: 'var(--accent-amber)',
                done: 'var(--accent-purple)',
              };
              const color = statusColors[item.status] || 'var(--text-tertiary)';

              return (
                <div
                  key={item.id}
                  className="rounded-lg transition-all duration-200"
                  style={{
                    background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    border: isExpanded ? '1px solid var(--border-default)' : '1px solid transparent',
                    marginBottom: isExpanded ? '0.5rem' : '0',
                  }}
                >
                  {/* Item row */}
                  <div
                    className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: !isExpanded && !isDone ? 'transparent' : isDone ? 'rgba(0,0,0,0.02)' : 'transparent' }}
                    onClick={() => toggleItemExpanded(item.id)}
                  >
                    {/* Top line: chevron + checkbox + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-quaternary)', flexShrink: 0 }}>
                        <ChevronRight size={16} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>

                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                        border: `2px solid ${isDone ? 'var(--accent-green)' : 'var(--border-default)'}`,
                        background: isDone ? 'var(--accent-green)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isDone && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      <span style={{
                        flex: 1, fontSize: '0.875rem', minWidth: 0,
                        color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      }}>
                        {item.title}
                      </span>
                    </div>

                    {/* Second line: indicators + status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', marginLeft: 'calc(16px + 0.5rem + 16px + 0.5rem)' }}>
                      {(fileCount > 0 || commentCount > 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {fileCount > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.625rem', color: 'var(--text-quaternary)' }}>
                              <Paperclip size={10} />{fileCount}
                            </span>
                          )}
                          {commentCount > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.625rem', color: 'var(--text-quaternary)' }}>
                              <MessageSquare size={10} />{commentCount}
                            </span>
                          )}
                        </div>
                      )}

                      <span style={{
                        fontSize: '0.625rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                        background: `${color}12`, color: color, textTransform: 'capitalize' as const,
                      }}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <div
                    className="grid transition-all duration-200 ease-out"
                    style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div className="px-2 sm:px-4 pb-3 sm:pb-4 pt-1">
                        {/* Tab bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-default)' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setItemTab(item.id, 'files'); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem',
                              fontSize: '0.75rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                              borderBottom: `2px solid ${activeTab === 'files' ? 'var(--accent-blue)' : 'transparent'}`,
                              color: activeTab === 'files' ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                              marginBottom: '-1px', transition: 'all 0.15s',
                            }}
                          >
                            <Paperclip size={12} />
                            Files{fileCount > 0 && <span style={{ opacity: 0.7, fontSize: '0.625rem' }}>{fileCount}</span>}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setItemTab(item.id, 'comments'); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem',
                              fontSize: '0.75rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                              borderBottom: `2px solid ${activeTab === 'comments' ? 'var(--accent-blue)' : 'transparent'}`,
                              color: activeTab === 'comments' ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                              marginBottom: '-1px', transition: 'all 0.15s',
                            }}
                          >
                            <MessageSquare size={12} />
                            Comments{commentCount > 0 && <span style={{ opacity: 0.7, fontSize: '0.625rem' }}>{commentCount}</span>}
                          </button>
                        </div>

                        {/* Tab content */}
                        {activeTab === 'files' ? (
                          <div>
                            {itemFileList.length === 0 ? (
                              <p style={{ color: 'var(--text-quaternary)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem 0' }}>
                                No files attached to this item
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {itemFileList.map(renderFileCard)}
                              </div>
                            )}
                          </div>
                        ) : (
                          renderCommentThread(itemCommentList, item.id)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Files */}
      <div className="rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <FileText size={16} style={{ color: 'var(--text-tertiary)' }} />
          <h2 className="text-xs sm:text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>General Files</h2>
          {bundleFiles.length > 0 && (
            <span style={{ color: 'var(--text-quaternary)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{bundleFiles.length}</span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          {bundleFiles.length === 0 ? (
            <p style={{ color: 'var(--text-quaternary)', fontSize: '0.8125rem', textAlign: 'center', padding: '0.5rem 0' }}>
              No general files yet
            </p>
          ) : (
            <div className="space-y-1.5">
              {bundleFiles.map(renderFileCard)}
            </div>
          )}
        </div>
      </div>

      {/* General Comments */}
      <div className="rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <MessageSquare size={16} style={{ color: 'var(--text-tertiary)' }} />
          <h2 className="text-xs sm:text-sm font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>General Feedback</h2>
          {bundleComments.length > 0 && (
            <span style={{ color: 'var(--text-quaternary)', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{bundleComments.length}</span>
          )}
        </div>
        <div className="p-3 sm:p-4">
          {renderCommentThread(bundleComments)}
        </div>
      </div>
    </div>
  );
}
