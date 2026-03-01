'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Upload Contract</h1>

      <form onSubmit={handleUpload} className="bg-white rounded-lg p-6 border">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-2">Contract PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border rounded p-2 w-full"
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
            className="border rounded p-2 w-full"
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
            className="border rounded p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Upload Contract'}
        </button>
      </form>
    </div>
  );
}
