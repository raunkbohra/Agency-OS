'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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
    <PageTransition>
      <Link
        href="/dashboard/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Contracts
      </Link>

      <div className="max-w-xl mx-auto">
      <PageHeader title="Upload Contract" description="Upload a contract PDF for a client" />

      <form onSubmit={handleUpload} className="bg-bg-secondary rounded-xl p-5 border border-border-default space-y-4">
        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Contract PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Client ID</label>
          <input
            type="text"
            placeholder="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Client Plan ID</label>
          <input
            type="text"
            placeholder="Client Plan ID"
            value={clientPlanId}
            onChange={(e) => setClientPlanId(e.target.value)}
            className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-accent-blue/90 transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload Contract'}
        </button>
      </form>
      </div>
    </PageTransition>
  );
}
