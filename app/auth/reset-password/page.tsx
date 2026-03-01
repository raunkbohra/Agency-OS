'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
      } else {
        setDone(true);
        setTimeout(() => router.push('/auth/signin'), 3000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm" style={{ color: '#f87171' }}>Invalid reset link. Please request a new one.</p>
        <Link href="/auth/forgot-password" className="text-sm mt-3 inline-block hover:text-white transition-colors" style={{ color: '#b0bec8' }}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!done ? (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white">Set new password</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Must be at least 8 characters</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>New password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555565' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>Confirm password</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)', boxShadow: '0 4px 20px rgba(107,126,147,0.25)' }}
            >
              {loading ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-5" style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.25)' }}>
            <CheckCircle size={22} style={{ color: '#22c55e' }} />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Password updated</h2>
          <p className="text-sm" style={{ color: '#6b7280' }}>Redirecting you to sign in…</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#060609' }}
    >
      <div className="absolute pointer-events-none" style={{ top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(107,126,147,0.06), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(143,160,176,0.05), transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}>
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Agency OS</span>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(12, 12, 20, 0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <Suspense fallback={<div className="text-center text-sm" style={{ color: '#6b7280' }}>Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white" style={{ color: '#555565' }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
