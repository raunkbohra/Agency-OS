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
        <div className="bg-accent-green/10 border-2 border-accent-green/20 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-accent-green mb-2">Payment Submitted</h1>
          <p className="text-accent-green mb-4">
            Your payment has been submitted for verification. We will confirm the transaction shortly.
          </p>
          <p className="text-sm text-accent-green/80">Redirecting to invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={`/dashboard/invoices/${invoiceId}`} className="text-accent-blue hover:text-accent-blue/90 font-medium">
          ← Back to Invoice
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Submit Payment</h1>

      <div className="bg-accent-blue/10 border-l-4 border-accent-blue p-6 rounded mb-8">
        <h3 className="font-semibold text-accent-blue mb-2">Bank Transfer Instructions</h3>
        <p className="text-sm text-accent-blue/80 mb-4">
          Please transfer the amount below to the agency bank account. Use your transaction ID or bank reference number as the reference ID below.
        </p>
        <div className="bg-bg-secondary p-4 rounded mt-4 space-y-2 text-sm text-text-secondary">
          <p><strong>Bank:</strong> Your Bank Name</p>
          <p><strong>Account Number:</strong> Account Number</p>
          <p><strong>Routing Number:</strong> Routing Code</p>
          <p><strong>Account Name:</strong> Your Agency Name</p>
          <p className="pt-2 text-lg font-bold text-text-primary">Amount Due: ₹{parseFloat(amount).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-secondary p-8 rounded-lg border border-border-default space-y-6">
        {error && (
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="referenceId" className="block font-semibold mb-2 text-text-secondary">
            Transaction Reference ID <span className="text-accent-red">*</span>
          </label>
          <input
            id="referenceId"
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g., TXN12345 or Bank Confirmation Number"
            className="w-full px-4 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            required
            disabled={loading}
            autoFocus
          />
          <p className="text-sm text-text-secondary mt-1">The reference ID from your bank transfer confirmation</p>
        </div>

        <div>
          <label htmlFor="receipt" className="block font-semibold mb-2 text-text-secondary">
            Upload Receipt <span className="text-text-tertiary">(optional)</span>
          </label>
          <input
            id="receipt"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-lg focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            disabled={loading}
          />
          <p className="text-sm text-text-secondary mt-1">Bank transfer receipt or confirmation (image or PDF)</p>
          {receipt && <p className="text-sm text-accent-green mt-2">File selected: {receipt.name}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !referenceId.trim()}
          className="w-full px-6 py-3 bg-accent-green text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-accent-green/90 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Payment for Verification'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="mt-4 w-full px-6 py-3 border-2 border-border-default text-text-secondary rounded-lg font-semibold hover:bg-bg-hover transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
