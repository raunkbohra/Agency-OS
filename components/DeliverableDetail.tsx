'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Pencil, Check, X, Trash2, Plus,
  ChevronRight, MessageSquare, Paperclip,
  Link2, ExternalLink, FileText
} from 'lucide-react';

interface DeliverableItemType {
  id: string;
  deliverable_id: string;
  title: string;
  description?: string;
  status: string;
  plan_item_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const ITEM_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-bg-hover text-text-primary',
  in_review: 'bg-accent-blue/10 text-accent-blue',
  approved: 'bg-accent-green/10 text-accent-green',
  changes_requested: 'bg-accent-amber/10 text-accent-amber',
  done: 'bg-accent-purple/10 text-accent-purple',
};

interface DeliverableDetailProps {
  deliverable: any;
  deliverableId: string;
}

export default function DeliverableDetail({ deliverable, deliverableId }: DeliverableDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(deliverable.status);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [items, setItems] = useState<DeliverableItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(deliverable.title);
  const [titleDraft, setTitleDraft] = useState(deliverable.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null);
  const [confirmDeleteFileId, setConfirmDeleteFileId] = useState<string | null>(null);
  // Per-item active tab: 'files' | 'comments'
  const [itemActiveTabs, setItemActiveTabs] = useState<Record<string, 'files' | 'comments'>>({});
  // Per-item comment/URL states
  const [itemCommentTexts, setItemCommentTexts] = useState<Record<string, string>>({});
  const [itemRevisionFlags, setItemRevisionFlags] = useState<Record<string, boolean>>({});
  const [itemMediaUrls, setItemMediaUrls] = useState<Record<string, string>>({});
  // Bundle-level
  const [bundleComment, setBundleComment] = useState('');
  const [bundleRevisionFlag, setBundleRevisionFlag] = useState(false);
  const [bundleMediaUrl, setBundleMediaUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/deliverables/${deliverableId}`);
      const data = await res.json();
      setFiles(data.files || []);
      setComments(data.comments || []);
      setItems(data.items || []);
      setStatus(data.deliverable?.status || deliverable.status);
      setLoading(false);
    };
    fetchData();
  }, [deliverableId]);

  // Grouping helpers
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

  // --- Handlers ---

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
  };

  const handleItemStatusChange = async (itemId: string, newStatus: string) => {
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemStatus: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || items.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
      if (data.bundleStatus) setStatus(data.bundleStatus);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItemTitle.trim() }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems([...items, item]);
        setNewItemTitle('');
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirmDeleteItemId !== itemId) {
      setConfirmDeleteItemId(itemId);
      setConfirmDeleteFileId(null);
      return;
    }
    setConfirmDeleteItemId(null);
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        setItems(items.filter(i => i.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleRenameItem = async (itemId: string) => {
    const trimmed = editingItemTitle.trim();
    if (!trimmed) { setEditingItemId(null); return; }
    const current = items.find(i => i.id === itemId);
    if (current && trimmed === current.title) { setEditingItemId(null); return; }
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, title: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || items.map(i => i.id === itemId ? { ...i, title: trimmed } : i));
      }
    } catch (error) {
      console.error('Failed to rename item:', error);
    } finally {
      setEditingItemId(null);
    }
  };

  const handleAddComment = async (itemId?: string) => {
    const commentText = itemId ? (itemCommentTexts[itemId] || '') : bundleComment;
    const revisionFlag = itemId ? (itemRevisionFlags[itemId] || false) : bundleRevisionFlag;
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: commentText, isRevisionRequest: revisionFlag, itemId: itemId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments([data, ...comments]);
        if (itemId) {
          setItemCommentTexts(prev => ({ ...prev, [itemId]: '' }));
          setItemRevisionFlags(prev => ({ ...prev, [itemId]: false }));
        } else {
          setBundleComment('');
          setBundleRevisionFlag(false);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file || uploadingFile) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    if (itemId) formData.append('itemId', itemId);

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const newFile = await res.json();
        setFiles([newFile, ...files]);
        e.target.value = '';
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirmDeleteFileId !== fileId) {
      setConfirmDeleteFileId(fileId);
      setConfirmDeleteItemId(null);
      return;
    }
    setConfirmDeleteFileId(null);
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleAddMediaUrl = async (itemId?: string) => {
    const url = itemId ? (itemMediaUrls[itemId] || '') : bundleMediaUrl;
    if (!url.trim()) return;
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: url,
          fileName: new URL(url).pathname.split('/').pop() || 'media',
          itemId: itemId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFiles([data, ...files]);
        if (itemId) setItemMediaUrls(prev => ({ ...prev, [itemId]: '' }));
        else setBundleMediaUrl('');
      }
    } catch (error) {
      console.error('Failed to add media URL:', error);
    }
  };

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === title) { setTitleDraft(title); setEditingTitle(false); return; }
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) { setTitle(trimmed); setEditingTitle(false); router.refresh(); }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') { setTitleDraft(title); setEditingTitle(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-7 w-48 bg-bg-tertiary rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-bg-secondary rounded-xl border border-border-default" />)}
        </div>
        <div className="h-48 bg-bg-secondary rounded-xl border border-border-default" />
      </div>
    );
  }

  const completedItems = items.filter(i => i.status === 'done' || i.status === 'approved').length;

  // --- Render helpers ---

  const renderFileCard = (file: any) => (
    <div
      key={file.id}
      className="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-bg-tertiary/50 border border-border-default hover:border-border-hover group transition-all duration-150"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
        {file.file_url?.startsWith('http') ? (
          <Link2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-blue" />
        ) : (
          <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent-blue" />
        )}
      </div>
      <span className="text-xs sm:text-sm text-text-primary truncate flex-1 min-w-0">{file.file_name}</span>
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {confirmDeleteFileId === file.id ? (
          <>
            <button
              onClick={() => handleDeleteFile(file.id)}
              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDeleteFileId(null)}
              className="px-2 py-1 rounded-md text-[10px] font-semibold text-text-tertiary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => handleDeleteFile(file.id)}
              className="p-1.5 rounded-md text-text-tertiary hover:text-accent-red hover:bg-accent-red/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderUploadArea = (itemId?: string) => (
    <div className="space-y-2">
      <label className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-dashed cursor-pointer transition-all duration-150 ${
        uploadingFile
          ? 'border-border-default bg-bg-tertiary/30 text-text-tertiary cursor-not-allowed'
          : 'border-border-hover hover:border-accent-blue/40 active:bg-accent-blue/5 hover:bg-accent-blue/5 text-text-secondary hover:text-accent-blue'
      }`}>
        <Upload className="h-4 w-4" />
        <span className="text-xs sm:text-sm font-medium">{uploadingFile ? 'Uploading...' : 'Upload file'}</span>
        <input type="file" onChange={(e) => handleFileUpload(e, itemId)} disabled={uploadingFile} className="hidden" />
      </label>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-bg-tertiary border border-border-default focus-within:border-accent-blue/40 transition-colors min-w-0">
          <Link2 className="h-3.5 w-3.5 text-text-quaternary flex-shrink-0 hidden sm:block" />
          <input
            type="url"
            placeholder="Paste a URL..."
            value={itemId ? (itemMediaUrls[itemId] || '') : bundleMediaUrl}
            onChange={(e) => {
              if (itemId) setItemMediaUrls(prev => ({ ...prev, [itemId]: e.target.value }));
              else setBundleMediaUrl(e.target.value);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMediaUrl(itemId); }}
            className="flex-1 bg-transparent text-xs sm:text-sm text-text-primary placeholder-text-quaternary focus:outline-none min-w-0"
          />
        </div>
        <button
          onClick={() => handleAddMediaUrl(itemId)}
          disabled={!(itemId ? itemMediaUrls[itemId]?.trim() : bundleMediaUrl.trim())}
          className="px-2.5 sm:px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-xs sm:text-sm font-medium hover:bg-accent-blue/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );

  const renderCommentThread = (commentList: any[], itemId?: string) => {
    const commentText = itemId ? (itemCommentTexts[itemId] || '') : bundleComment;
    const revisionFlag = itemId ? (itemRevisionFlags[itemId] || false) : bundleRevisionFlag;

    return (
      <div className="space-y-3">
        {/* Input */}
        <div className="space-y-2">
          <div className="rounded-lg border border-border-default bg-bg-tertiary focus-within:border-accent-blue/40 transition-colors overflow-hidden">
            <textarea
              value={commentText}
              onChange={(e) => {
                if (itemId) setItemCommentTexts(prev => ({ ...prev, [itemId]: e.target.value }));
                else setBundleComment(e.target.value);
              }}
              className="w-full px-3 py-2.5 bg-transparent text-sm text-text-primary placeholder-text-quaternary focus:outline-none resize-none"
              placeholder="Write a comment..."
              rows={2}
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-border-default bg-bg-secondary/50">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={revisionFlag}
                  onChange={(e) => {
                    if (itemId) setItemRevisionFlags(prev => ({ ...prev, [itemId]: e.target.checked }));
                    else setBundleRevisionFlag(e.target.checked);
                  }}
                  className="rounded border-border-hover"
                />
                <span className="text-xs text-text-tertiary">Mark as revision request</span>
              </label>
              <button
                onClick={() => handleAddComment(itemId)}
                disabled={!commentText.trim()}
                className="px-3 py-1 bg-accent-blue text-white text-xs rounded-md font-medium hover:bg-accent-blue/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Thread */}
        {commentList.length > 0 && (
          <div className="space-y-2">
            {commentList.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg px-3.5 py-3 border transition-colors ${
                  comment.is_revision_request
                    ? 'border-accent-amber/20 bg-accent-amber/5'
                    : 'border-border-default bg-bg-tertiary/40'
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{comment.user_name || 'Unknown'}</span>
                  <span className="text-[11px] text-text-quaternary">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{comment.comment}</p>
                {comment.is_revision_request && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-accent-amber/10 text-accent-amber rounded text-[10px] font-semibold uppercase tracking-wider">
                    Revision Request
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
    <div className="space-y-4 sm:space-y-5">
      {/* Title */}
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <input
            ref={titleInputRef}
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-lg sm:text-xl font-bold text-text-primary bg-bg-secondary border border-border-active rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-border-active min-w-0"
          />
          <button onClick={handleTitleSave} className="p-1.5 rounded-lg hover:bg-accent-green/10 text-accent-green transition-colors">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => { setTitleDraft(title); setEditingTitle(false); }} className="p-1.5 rounded-lg hover:bg-accent-red/10 text-accent-red transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">{title}</h1>
          <button
            onClick={() => setEditingTitle(true)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-tertiary transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-default">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Status</p>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full border border-border-default rounded-lg px-3 py-2 bg-bg-tertiary text-text-primary text-sm focus:border-border-active focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-default">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Month</p>
          <p className="text-base font-semibold text-text-primary">{deliverable.month_year}</p>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-default">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Due Date</p>
          <p className="text-base font-semibold text-text-primary">
            {deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Items with expandable per-item panels */}
      <div className="bg-bg-secondary rounded-xl p-3 sm:p-5 border border-border-default">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Items</h2>
          {items.length > 0 && (
            <span className="text-xs text-text-tertiary font-medium tabular-nums">
              {completedItems}/{items.length} complete
            </span>
          )}
        </div>

        {/* Progress */}
        {items.length > 0 && (
          <div className="w-full h-1 bg-bg-tertiary rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-accent-green rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedItems / items.length) * 100}%` }}
            />
          </div>
        )}

        {items.length > 0 ? (
          <div className="space-y-px">
            {items.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const itemFiles = filesForItem(item.id);
              const itemCommentList = commentsForItem(item.id);
              const fileCount = itemFiles.length;
              const commentCount = itemCommentList.length;
              const activeTab = getItemTab(item.id);
              const isDone = item.status === 'done' || item.status === 'approved';

              return (
                <div
                  key={item.id}
                  className={`rounded-lg transition-all duration-200 ${
                    isExpanded ? 'bg-bg-tertiary/30 ring-1 ring-border-default mb-2' : ''
                  }`}
                >
                  {/* Item row */}
                  <div className={`px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-colors group cursor-pointer ${
                    !isExpanded ? 'hover:bg-bg-hover' : ''
                  }`}
                    onClick={() => toggleItemExpanded(item.id)}
                  >
                    {/* Single line: chevron + checkbox + title + controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                      <span className="flex-shrink-0 text-text-quaternary">
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </span>

                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleItemStatusChange(item.id, isDone ? 'draft' : 'done')}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded flex-shrink-0 border-border-hover h-4 w-4"
                      />

                      {editingItemId === item.id ? (
                        <input
                          type="text"
                          value={editingItemTitle}
                          onChange={(e) => setEditingItemTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameItem(item.id);
                            if (e.key === 'Escape') setEditingItemId(null);
                          }}
                          onBlur={() => handleRenameItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 text-sm px-2 py-0.5 rounded bg-bg-tertiary border border-border-active text-text-primary focus:outline-none min-w-0"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); setEditingItemTitle(item.title); }}
                          className={`flex-1 text-sm cursor-default select-none truncate min-w-0 ${isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}`}
                        >
                          {item.title}
                        </span>
                      )}

                      {/* Inline controls — always visible */}
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Indicators — hidden on mobile to save space */}
                        {(fileCount > 0 || commentCount > 0) && (
                          <div className="hidden sm:flex items-center gap-1.5 mr-0.5">
                            {fileCount > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-quaternary">
                                <Paperclip className="h-2.5 w-2.5" />{fileCount}
                              </span>
                            )}
                            {commentCount > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-quaternary">
                                <MessageSquare className="h-2.5 w-2.5" />{commentCount}
                              </span>
                            )}
                          </div>
                        )}

                        {editingItemId !== item.id && (
                          <button
                            onClick={() => { setEditingItemId(item.id); setEditingItemTitle(item.title); }}
                            className="p-1 rounded sm:opacity-0 sm:group-hover:opacity-100 hover:bg-bg-hover text-text-tertiary transition-all"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}

                        <select
                          value={item.status}
                          onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                          className={`text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded border-0 cursor-pointer ${ITEM_STATUS_STYLES[item.status] || 'bg-bg-hover text-text-primary'}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">Review</option>
                          <option value="approved">Approved</option>
                          <option value="changes_requested">Changes</option>
                          <option value="done">Done</option>
                        </select>

                        {confirmDeleteItemId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded bg-accent-red/15 text-accent-red hover:bg-accent-red/25 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteItemId(null)}
                              className="text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded bg-bg-hover text-text-tertiary hover:text-text-secondary transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded sm:opacity-0 sm:group-hover:opacity-100 hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <div
                    className="grid transition-all duration-200 ease-out"
                    style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-2 sm:px-4 pb-3 sm:pb-4 pt-1">
                        {/* Tab bar */}
                        <div className="flex items-center gap-1 mb-3 border-b border-border-default">
                          <button
                            onClick={() => setItemTab(item.id, 'files')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                              activeTab === 'files'
                                ? 'border-accent-blue text-accent-blue'
                                : 'border-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                          >
                            <Paperclip className="h-3 w-3" />
                            Files{fileCount > 0 && <span className="ml-0.5 text-[10px] opacity-70">{fileCount}</span>}
                          </button>
                          <button
                            onClick={() => setItemTab(item.id, 'comments')}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                              activeTab === 'comments'
                                ? 'border-accent-blue text-accent-blue'
                                : 'border-transparent text-text-tertiary hover:text-text-secondary'
                            }`}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Comments{commentCount > 0 && <span className="ml-0.5 text-[10px] opacity-70">{commentCount}</span>}
                          </button>
                        </div>

                        {/* Tab content */}
                        {activeTab === 'files' ? (
                          <div className="space-y-2.5">
                            {renderUploadArea(item.id)}
                            {itemFiles.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {itemFiles.map(renderFileCard)}
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
        ) : (
          <p className="text-sm text-text-tertiary mb-3">No items yet.</p>
        )}

        {/* Add item */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border-default">
          <input
            type="text"
            placeholder="Add new item..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            className="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-default text-text-primary text-sm placeholder-text-tertiary focus:border-border-active focus:outline-none"
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemTitle.trim() || addingItem}
            className="px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-semibold hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>

      {/* Bundle-level Files & Media */}
      <div className="bg-bg-secondary rounded-xl border border-border-default">
        <div className="flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 border-b border-border-default">
          <Paperclip className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs sm:text-sm font-semibold text-text-secondary uppercase tracking-wide flex-1">General Files</h2>
          {bundleFiles.length > 0 && (
            <span className="text-xs text-text-quaternary tabular-nums">{bundleFiles.length}</span>
          )}
        </div>
        <div className="p-3 sm:p-5 space-y-3">
          {renderUploadArea()}
          {bundleFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {bundleFiles.map(renderFileCard)}
            </div>
          )}
          {bundleFiles.length === 0 && (
            <p className="text-sm text-text-quaternary text-center py-2">No general files yet</p>
          )}
        </div>
      </div>

      {/* Bundle-level Comments */}
      <div className="bg-bg-secondary rounded-xl border border-border-default">
        <div className="flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 border-b border-border-default">
          <MessageSquare className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs sm:text-sm font-semibold text-text-secondary uppercase tracking-wide flex-1">General Comments</h2>
          {bundleComments.length > 0 && (
            <span className="text-xs text-text-quaternary tabular-nums">{bundleComments.length}</span>
          )}
        </div>
        <div className="p-3 sm:p-5">
          {renderCommentThread(bundleComments)}
        </div>
      </div>
    </div>
  );
}
