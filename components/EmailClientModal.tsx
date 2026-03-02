'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface EmailClientModalProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailClientModal({ clientId, clientName, clientEmail, isOpen, onClose }: EmailClientModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { setError('Subject and message are required'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to send'); }
      setSent(true);
      setTimeout(() => { setSent(false); setSubject(''); setBody(''); onClose(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-bg-primary border border-border-default rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Email {clientName}</h2>
            <p className="text-xs text-text-tertiary mt-0.5">{clientEmail}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-green/15 flex items-center justify-center mx-auto mb-3">
              <Send className="h-5 w-5 text-accent-green" />
            </div>
            <p className="text-sm font-medium text-accent-green">Email sent!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {error && <p className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3 py-2 rounded-lg">{error}</p>}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Monthly Report Ready" className="w-full px-3 py-2.5 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-border-active focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Message</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." rows={5} className="w-full px-3 py-2.5 text-sm border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-border-active focus:outline-none resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSend} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-sm font-semibold rounded-lg hover:bg-accent-blue/90 disabled:opacity-50 transition-colors">
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Sending...' : 'Send Email'}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 text-sm border border-border-default text-text-secondary rounded-lg hover:bg-bg-hover transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
