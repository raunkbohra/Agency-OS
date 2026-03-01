'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignUpPage() {
  const [form, setForm] = useState({ name: '', email: '', agencyName: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }

      // Sign in automatically after signup
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result?.error) {
        // Account created, redirect to sign in
        router.push('/auth/signin?registered=1');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-12"
      style={{ background: '#060609' }}
    >
      <div className="absolute pointer-events-none" style={{ top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,112,243,0.06), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.05), transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0070f3, #7c3aed)' }}>
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Agency OS</span>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(12, 12, 20, 0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white">Create your account</h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Start managing your agency today</p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => { setGoogleLoading(true); signIn('google', { callbackUrl: '/dashboard' }); }}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 mb-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb' }}
          >
            {googleLoading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs" style={{ color: '#3b3b4f' }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>Your name</label>
              <Input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>Agency name</label>
              <Input type="text" value={form.agencyName} onChange={set('agencyName')} placeholder="Acme Agency" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>Email</label>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@agency.com" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#9ca3af' }}>Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 8 characters"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#555565' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0070f3, #7c3aed)', boxShadow: '0 4px 20px rgba(0,112,243,0.25)' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#555565' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium hover:text-white transition-colors" style={{ color: '#60a5fa' }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
