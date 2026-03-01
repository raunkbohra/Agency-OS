'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  if (loading) return <div className="text-text-tertiary">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-text-primary">{deliverable.title}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-secondary p-4 rounded border border-border-default">
          <p className="text-sm text-text-secondary">Status</p>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="mt-2 w-full border border-border-default rounded p-2 bg-bg-tertiary text-text-primary"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="bg-bg-secondary p-4 rounded border border-border-default">
          <p className="text-sm text-text-secondary">Month</p>
          <p className="text-lg font-semibold mt-2 text-text-primary">{deliverable.month_year}</p>
        </div>

        <div className="bg-bg-secondary p-4 rounded border border-border-default">
          <p className="text-sm text-text-secondary">Due Date</p>
          <p className="text-lg font-semibold mt-2 text-text-primary">
            {deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-lg p-6 mb-8 border border-border-default">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Files</h2>
        {files.length === 0 ? (
          <p className="text-text-secondary">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex justify-between items-center border-b border-border-default pb-2">
                <span className="text-text-primary">{file.file_name}</span>
                <a href={file.file_url} className="text-accent-blue hover:underline">
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-bg-secondary rounded-lg p-6 border border-border-default">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Comments</h2>
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-border-default rounded p-3 mb-2 bg-bg-tertiary text-text-primary placeholder-text-tertiary"
            placeholder="Add a comment..."
            rows={3}
          />
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={isRevisionRequest}
              onChange={(e) => setIsRevisionRequest(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-text-primary">This is a revision request</span>
          </label>
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-accent-blue text-white rounded font-medium hover:bg-accent-blue/90"
          >
            Add Comment
          </button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-border-default rounded p-4 bg-bg-tertiary">
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-text-primary">{comment.user_name || 'Unknown User'}</p>
                <span className="text-xs text-text-secondary">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-text-primary">{comment.comment}</p>
              {comment.is_revision_request && (
                <span className="inline-block mt-2 px-2 py-1 bg-accent-amber/10 text-accent-amber text-xs rounded">
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
