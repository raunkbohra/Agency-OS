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

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{deliverable.title}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Status</p>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="mt-2 w-full border rounded p-2"
          >
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Month</p>
          <p className="text-lg font-semibold mt-2">{deliverable.month_year}</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <p className="text-sm text-gray-600">Due Date</p>
          <p className="text-lg font-semibold mt-2">
            {deliverable.due_date ? new Date(deliverable.due_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Files</h2>
        {files.length === 0 ? (
          <p className="text-gray-600">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex justify-between items-center border-b pb-2">
                <span>{file.file_name}</span>
                <a href={file.file_url} className="text-blue-600 hover:underline">
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border rounded p-3 mb-2"
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
            <span className="text-sm">This is a revision request</span>
          </label>
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium"
          >
            Add Comment
          </button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded p-4 bg-gray-50">
              <div className="flex justify-between mb-2">
                <p className="font-semibold">{comment.user_id}</p>
                <span className="text-xs text-gray-600">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-800">{comment.comment}</p>
              {comment.is_revision_request && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
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
