'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';

export default function ContractUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientPlanId, setClientPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!file || !clientId || !clientPlanId) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('clientPlanId', clientPlanId);

      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        router.push('/dashboard/contracts');
      } else {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="p-8 max-w-2xl mx-auto">
      <PageHeader title="Upload Contract" description="Upload a contract PDF for a client" />

      <form onSubmit={handleUpload} className="bg-bg-secondary rounded-lg p-6 border border-border-default">
        {error && (
          <div className="mb-4 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-2">Contract PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border border-border-default bg-bg-tertiary text-text-primary rounded p-2 w-full"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Client</label>
          <input
            type="text"
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="border border-border-default bg-bg-tertiary text-text-primary rounded p-2 w-full"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Client Plan</label>
          <input
            type="text"
            placeholder="Client Plan ID"
            value={clientPlanId}
            onChange={(e) => setClientPlanId(e.target.value)}
            className="border border-border-default bg-bg-tertiary text-text-primary rounded p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-accent-blue text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Contract'}
        </button>
      </form>
    </PageTransition>
  );
}
