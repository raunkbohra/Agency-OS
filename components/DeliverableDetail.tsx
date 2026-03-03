'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

interface DeliverableDetailProps {
  deliverable: any;
  deliverableId: string;
}

export default function DeliverableDetail({ deliverable, deliverableId }: DeliverableDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(deliverable.status);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isRevisionRequest, setIsRevisionRequest] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/deliverables/${deliverableId}`);
      const data = await res.json();
      setFiles(data.files || []);
      setComments(data.comments || []);
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

  const handleAddComment = async () => {
    const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment, isRevisionRequest }),
    });

    if (res.ok) {
      setNewComment('');
      setIsRevisionRequest(false);
      router.refresh();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('fileName', e.target.files[0].name);

    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.refresh();
        e.target.value = '';
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploadingFile(false);
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
        setMediaUrl('');
        router.refresh();
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

  if (loading) return <div className="text-text-tertiary">Loading...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text-primary">{deliverable.title}</h1>

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

      <div className="bg-bg-secondary rounded-xl p-5 border border-border-default">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Files & Media</h2>

        {/* Upload Section */}
        <div className="space-y-3 mb-5 pb-5 border-b border-border-default">
          {/* File Upload */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-blue/10 text-accent-blue cursor-pointer hover:bg-accent-blue/20 transition-colors text-sm font-medium">
              <Upload className="h-4 w-4" />
              Upload File
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
            {uploadingFile && <span className="text-xs text-text-tertiary">Uploading...</span>}
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
              <li key={file.id} className="flex justify-between items-center border-b border-border-default pb-2 last:border-0 last:pb-0">
                <span className="text-sm text-text-primary truncate flex-1 mr-4">{file.file_name}</span>
                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent-blue hover:underline flex-shrink-0">
                  View
                </a>
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
