'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Pencil, Check, X, Trash2, Plus } from 'lucide-react';

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
  const [newComment, setNewComment] = useState('');
  const [isRevisionRequest, setIsRevisionRequest] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(deliverable.title);
  const [titleDraft, setTitleDraft] = useState(deliverable.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');

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
    if (!trimmed) {
      setEditingItemId(null);
      return;
    }
    const current = items.find(i => i.id === itemId);
    if (current && trimmed === current.title) {
      setEditingItemId(null);
      return;
    }
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment, isRevisionRequest }),
      });

      const data = await res.json();

      if (res.ok) {
        setComments([data, ...comments]);
        setNewComment('');
        setIsRevisionRequest(false);
      } else {
        console.error('Failed to add comment:', data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadingFile) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

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
        console.error('File upload failed:', errorData);
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleAddMediaUrl = async () => {
    if (!mediaUrl.trim()) return;

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: mediaUrl,
          fileName: new URL(mediaUrl).pathname.split('/').pop() || 'media',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFiles([data, ...files]);
        setMediaUrl('');
      } else {
        console.error('API Error:', {
          status: res.status,
          response: data
        });
      }
    } catch (error) {
      console.error('Failed to add media URL:', error);
    }
  };

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === title) {
      setTitleDraft(title);
      setEditingTitle(false);
      return;
    }
    const res = await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });
    if (res.ok) {
      setTitle(trimmed);
      setEditingTitle(false);
      router.refresh();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') {
      setTitleDraft(title);
      setEditingTitle(false);
    }
  };

  if (loading) return <div className="text-text-tertiary">Loading...</div>;

  const completedItems = items.filter(i => i.status === 'done' || i.status === 'approved').length;

  return (
    <div className="space-y-5">
      {editingTitle ? (
        <div className="flex items-center gap-2">
          <input
            ref={titleInputRef}
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-xl font-bold text-text-primary bg-bg-secondary border border-border-active rounded-lg px-3 py-1.5 flex-1 focus:outline-none focus:ring-1 focus:ring-border-active"
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
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          <button
            onClick={() => setEditingTitle(true)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-tertiary transition-all"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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

      {/* Items Checklist */}
      <div className="bg-bg-secondary rounded-xl p-5 border border-border-default">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Items
          </h2>
          {items.length > 0 && (
            <span className="text-xs text-text-tertiary font-medium">
              {completedItems}/{items.length} complete
            </span>
          )}
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="w-full h-1.5 bg-bg-tertiary rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-accent-green rounded-full transition-all duration-300"
              style={{ width: `${(completedItems / items.length) * 100}%` }}
            />
          </div>
        )}

        {items.length > 0 ? (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={item.status === 'done' || item.status === 'approved'}
                  onChange={() => {
                    const newStatus = (item.status === 'done' || item.status === 'approved') ? 'draft' : 'done';
                    handleItemStatusChange(item.id, newStatus);
                  }}
                  className="rounded flex-shrink-0"
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
                    autoFocus
                    className="flex-1 text-sm px-2 py-0.5 rounded bg-bg-tertiary border border-border-active text-text-primary focus:outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingItemId(item.id);
                      setEditingItemTitle(item.title);
                    }}
                    className={`flex-1 text-sm cursor-default ${
                      item.status === 'done' || item.status === 'approved'
                        ? 'text-text-tertiary line-through'
                        : 'text-text-primary'
                    }`}
                  >
                    {item.title}
                  </span>
                )}
                {editingItemId !== item.id && (
                  <button
                    onClick={() => {
                      setEditingItemId(item.id);
                      setEditingItemTitle(item.title);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-tertiary transition-all"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <select
                  value={item.status}
                  onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border-0 cursor-pointer ${ITEM_STATUS_STYLES[item.status] || 'bg-bg-hover text-text-primary'}`}
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="changes_requested">Changes Requested</option>
                  <option value="done">Done</option>
                </select>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
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

      <div className="bg-bg-secondary rounded-xl p-5 border border-border-default">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Files & Media</h2>

        {/* Upload Section */}
        <div className="space-y-3 mb-5 pb-5 border-b border-border-default">
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              uploadingFile
                ? 'bg-accent-blue/5 text-text-tertiary cursor-not-allowed'
                : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
            }`}>
              <Upload className="h-4 w-4" />
              {uploadingFile ? 'Uploading...' : 'Upload File'}
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Media URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste media URL (video, image, etc.)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border-default text-text-primary text-sm placeholder-text-tertiary focus:border-border-active focus:outline-none"
            />
            <button
              onClick={handleAddMediaUrl}
              disabled={!mediaUrl.trim()}
              className="px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <p className="text-sm text-text-tertiary">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex justify-between items-center border-b border-border-default pb-2 last:border-0 last:pb-0 group">
                <span className="text-sm text-text-primary truncate flex-1 mr-4">{file.file_name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent-blue hover:underline">
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/10 text-text-tertiary hover:text-accent-red transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-bg-secondary rounded-xl p-5 border border-border-default">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Comments</h2>
        <div className="mb-5">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-border-default rounded-lg px-3 py-2.5 mb-3 bg-bg-tertiary text-sm text-text-primary placeholder-text-tertiary focus:border-border-active focus:outline-none resize-none"
            placeholder="Add a comment..."
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRevisionRequest}
                onChange={(e) => setIsRevisionRequest(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-text-secondary">Revision request</span>
            </label>
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
            >
              Post
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-border-default rounded-xl px-4 py-3 bg-bg-tertiary">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-text-primary">{comment.user_name || 'Unknown User'}</p>
                <span className="text-xs text-text-tertiary">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-text-primary">{comment.comment}</p>
              {comment.is_revision_request && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-accent-amber/10 text-accent-amber text-[10px] font-semibold rounded uppercase tracking-wide">
                  Revision Request
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
