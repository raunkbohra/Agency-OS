'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle2 } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const validatePasswords = (): boolean => {
    setValidationError('');

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/client-portal/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'An error occurred');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/client-portal/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center light" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-[400px] px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: 'var(--accent-red)', color: 'white' }}>
            <KeyRound size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Invalid Reset Link
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            The reset link you're using is invalid or has expired.
          </p>
          <Link
            href="/client-portal/forgot-password"
            className="inline-block px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--accent-blue)' }}
          >
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center light" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-[400px] px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: 'var(--accent-green)', color: 'white' }}>
            <CheckCircle2 size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Password Updated
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center light" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-[400px] px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4" style={{ background: 'var(--accent-blue)', color: 'white' }}>
            <KeyRound size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Set New Password
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your new password</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: 'var(--accent-red)',
          }}>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {validationError && (
          <div className="mb-6 p-4 rounded-lg" style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: 'var(--accent-red)',
          }}>
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center light" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-[400px] px-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
