'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SignatureCanvas from '@/components/SignatureCanvas';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type Step = 'verify-email' | 'verify-code' | 'sign' | 'success' | 'error';

export default function ContractSigningPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<Step>('verify-email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [signature, setSignature] = useState('');
  const [signerName, setSignerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<any>(null);

  // Fetch contract data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/sign/contracts/${token}`);
        if (res.ok) {
          const data = await res.json();
          setContractData(data);
          setEmail(data.email);
          // If already verified, skip to signing
          if (data.verified) {
            setStep('sign');
          }
        } else {
          const data = await res.json();
          setError(data.error || 'Invalid signing link');
          setStep('error');
        }
      } catch (err) {
        setError('Failed to load contract');
        setStep('error');
      }
    };

    fetchData();
  }, [token]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });

      if (res.ok) {
        setStep('verify-code');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send code');
      }
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, code }),
      });

      if (res.ok) {
        setStep('sign');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature || !signerName) {
      setError('Please draw a signature and enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sign/submit-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          signatureImage: signature,
          signerName,
        }),
      });

      if (res.ok) {
        setStep('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit signature');
      }
    } catch (err) {
      setError('Failed to submit signature');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-6">
          <h1 className="text-xl font-bold text-accent-red mb-2">Signing Link Invalid</h1>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <Link
            href="/"
            className="text-sm text-accent-blue hover:text-accent-blue/80 font-medium"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Contract Signed</h1>
          <p className="text-sm text-text-secondary mb-6">
            Thank you for signing! We've received your signature and sent you a confirmation email.
          </p>
          <p className="text-xs text-text-tertiary">
            You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="bg-bg-secondary border border-border-default rounded-xl p-6 md:p-8">
          {contractData && (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                {contractData.fileName}
              </h1>
              <p className="text-sm text-text-secondary mb-8">
                Signing request for {contractData.clientName}
              </p>
            </>
          )}

          {error && (
            <div className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email Verification */}
          {step === 'verify-email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 'verify-code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-text-secondary">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('verify-email')}
                className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Use different email
              </button>
            </form>
          )}

          {/* Step 3: Signature */}
          {step === 'sign' && (
            <form onSubmit={handleSubmitSignature} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  Draw Your Signature *
                </label>
                <SignatureCanvas onSignatureChange={setSignature} />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                  placeholder="Your full name"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !signature || !signerName}
                className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Sign & Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
