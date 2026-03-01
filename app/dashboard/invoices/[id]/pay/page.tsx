'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const invoiceId = (params.id as string) || '';
  const amount = searchParams.get('amount') || '0';

  const [referenceId, setReferenceId] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!referenceId.trim()) {
        setError('Transaction reference ID is required');
        setLoading(false);
        return;
      }

      let receiptUrl: string | undefined;

      // If receipt file selected, prepare for upload
      if (receipt) {
        // TODO: Upload to S3 or Vercel Blob
        // For now, create a placeholder URL
        receiptUrl = `receipts/${invoiceId}/${receipt.name}`;
      }

      // Create payment record with receipt URL
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: parseFloat(amount),
          referenceId: referenceId.trim(),
          provider: 'bank_transfer',
          receiptUrl,
          meta: {
            hasReceipt: !!receipt,
            receiptFileName: receipt?.name,
            receiptSize: receipt?.size,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit payment');
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/invoices?status=payment_submitted');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting payment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">Payment Submitted</h1>
          <p className="text-green-700 mb-4">
            Your payment has been submitted for verification. We will confirm the transaction shortly.
          </p>
          <p className="text-sm text-green-600">Redirecting to invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={`/dashboard/invoices/${invoiceId}`} className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Invoice
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Submit Payment</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded mb-8">
        <h3 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h3>
        <p className="text-sm text-blue-800 mb-4">
          Please transfer the amount below to the agency bank account. Use your transaction ID or bank reference number as the reference ID below.
        </p>
        <div className="bg-white p-4 rounded mt-4 space-y-2 text-sm text-gray-700">
          <p><strong>Bank:</strong> Your Bank Name</p>
          <p><strong>Account Number:</strong> Account Number</p>
          <p><strong>Routing Number:</strong> Routing Code</p>
          <p><strong>Account Name:</strong> Your Agency Name</p>
          <p className="pt-2 text-lg font-bold text-gray-900">Amount Due: ₹{parseFloat(amount).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="referenceId" className="block font-semibold mb-2 text-gray-700">
            Transaction Reference ID <span className="text-red-600">*</span>
          </label>
          <input
            id="referenceId"
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g., TXN12345 or Bank Confirmation Number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            required
            disabled={loading}
            autoFocus
          />
          <p className="text-sm text-gray-600 mt-1">The reference ID from your bank transfer confirmation</p>
        </div>

        <div>
          <label htmlFor="receipt" className="block font-semibold mb-2 text-gray-700">
            Upload Receipt <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="receipt"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={loading}
          />
          <p className="text-sm text-gray-600 mt-1">Bank transfer receipt or confirmation (image or PDF)</p>
          {receipt && <p className="text-sm text-green-600 mt-2">File selected: {receipt.name}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !referenceId.trim()}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-400 hover:bg-green-700 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Payment for Verification'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="mt-4 w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
