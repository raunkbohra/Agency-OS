'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/client-portal/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center light" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-[400px] px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: 'var(--accent-blue)', color: 'white' }}>
            {submitted ? (
              <CheckCircle2 size={24} strokeWidth={1.5} />
            ) : (
              <Mail size={24} strokeWidth={1.5} />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {submitted ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {submitted ? (
          <>
            {/* Success Message */}
            <div className="mb-6 p-4 rounded-lg" style={{
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              color: 'var(--accent-green)',
            }}>
              <p className="text-sm font-medium mb-2">Email sent successfully!</p>
              <p className="text-xs">
                If an account exists with that email, a reset link has been sent. Please check your inbox (including spam folder).
              </p>
            </div>

            {/* Send Another Button */}
            <button
              onClick={() => setSubmitted(false)}
              className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all"
              style={{ background: 'var(--accent-blue)' }}
            >
              Send Another Link
            </button>
          </>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg text-sm transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 98, 120, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: 'var(--accent-blue)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Link
            href="/client-portal/login"
            className="transition-colors hover:underline"
            style={{ color: 'var(--accent-blue)' }}
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
