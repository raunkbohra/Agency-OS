'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

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
      <div className="max-w-lg mx-auto">
        <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-green/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-accent-green">✓</span>
          </div>
          <h1 className="text-xl font-bold text-accent-green mb-2">Payment Submitted</h1>
          <p className="text-sm text-accent-green/80 mb-1">
            Your payment has been submitted for verification.
          </p>
          <p className="text-xs text-accent-green/60">Redirecting to invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link href={`/dashboard/invoices/${invoiceId}`} className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Invoice
      </Link>

      <h1 className="text-xl font-bold text-text-primary">Submit Payment</h1>

      <div className="bg-accent-blue/[0.06] border border-accent-blue/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-accent-blue mb-1.5">Bank Transfer Instructions</h3>
        <p className="text-xs text-accent-blue/70 mb-3">
          Transfer the amount below to the agency bank account, then enter your transaction reference ID.
        </p>
        <div className="bg-bg-secondary rounded-lg p-3 space-y-1.5 text-sm text-text-secondary">
          <p><span className="font-medium text-text-primary">Bank:</span> Your Bank Name</p>
          <p><span className="font-medium text-text-primary">Account:</span> Account Number</p>
          <p><span className="font-medium text-text-primary">Routing:</span> Routing Code</p>
          <p><span className="font-medium text-text-primary">Name:</span> Your Agency Name</p>
          <p className="pt-2 text-base font-bold text-text-primary border-t border-border-default mt-2">
            Amount Due: ₹{parseFloat(amount).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-secondary rounded-xl border border-border-default p-5 space-y-5">
        {error && (
          <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="referenceId" className="block text-sm font-medium text-text-secondary mb-1.5">
            Transaction Reference ID <span className="text-accent-red">*</span>
          </label>
          <input
            id="referenceId"
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g., TXN12345"
            className="w-full px-3 py-2.5 border border-border-default bg-bg-tertiary text-text-primary rounded-lg text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            required
            disabled={loading}
            autoFocus
          />
          <p className="text-xs text-text-tertiary mt-1">Reference ID from your bank transfer confirmation</p>
        </div>

        <div>
          <label htmlFor="receipt" className="block text-sm font-medium text-text-secondary mb-1.5">
            Upload Receipt <span className="text-text-tertiary font-normal">(optional)</span>
          </label>
          <input
            id="receipt"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-border-default bg-bg-tertiary text-text-primary rounded-lg text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            disabled={loading}
          />
          {receipt && <p className="text-xs text-accent-green mt-1.5">Selected: {receipt.name}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !referenceId.trim()}
          className="w-full px-4 py-3 bg-accent-green text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-accent-green/90 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Payment for Verification'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="w-full px-4 py-2.5 border border-border-default text-sm text-text-secondary rounded-lg font-medium hover:bg-bg-hover transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
