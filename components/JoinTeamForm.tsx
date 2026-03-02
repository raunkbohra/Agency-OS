'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

interface JoinTeamFormProps {
  token: string;
}

export default function JoinTeamForm({ token }: JoinTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Form states
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  // Determine if user is logged in
  const isLoggedIn = !!session?.user;
  const userId = session?.user?.id;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (isLoggedIn) {
        // For existing users, just need token
        if (!userId) {
          throw new Error('User ID not found');
        }
      } else {
        // For new users, validate name and password
        if (!form.name.trim()) {
          throw new Error('Name is required');
        }
        if (!form.password) {
          throw new Error('Password is required');
        }
        if (!form.confirmPassword) {
          throw new Error('Please confirm your password');
        }

        // Validate password strength
        const passwordError = validatePassword(form.password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        // Check password match
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match');
        }
      }

      // Make request to accept invite
      const res = await fetch(`/api/auth/accept-team-invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLoggedIn
            ? { userId }
            : { name: form.name, password: form.password }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to accept invite');
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    height: '46px',
    padding: '0 16px',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#e2eaf0',
    background: focused === name ? 'rgba(180,200,220,0.07)' : 'rgba(255,255,255,0.03)',
    border: focused === name ? '1px solid rgba(180,205,225,0.38)' : '1px solid rgba(255,255,255,0.1)',
    outline: 'none',
    transition: 'all 0.18s ease',
    boxShadow: focused === name ? '0 0 0 3px rgba(160,190,215,0.08)' : 'none',
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-8 py-12" style={{ background: '#060609' }}>
      <style>{`
        .auth-input::placeholder { color: #8b95a3; }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0d1520 inset !important;
          -webkit-text-fill-color: #e2eaf0 !important;
          caret-color: #e2eaf0;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(ellipse at center, rgba(107,126,147,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}>
            <span className="text-white font-bold text-[11px]">A</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Agency OS</span>
        </div>

        <div className="mb-8">
          <h1 className="text-[28px] font-black tracking-[-0.03em] text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isLoggedIn ? 'Join Team' : 'Create Your Account'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>
            {isLoggedIn
              ? 'You are invited to join a team on Agency OS'
              : 'Set up your account to join the team'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
            >
              {error}
            </motion.div>
          )}

          {!isLoggedIn && (
            <>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8b95a3' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholder="Jane Smith"
                  required
                  autoFocus
                  className="auth-input"
                  style={inputStyle('name')}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8b95a3' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="At least 8 characters with uppercase & number"
                    required
                    className="auth-input"
                    style={{ ...inputStyle('password'), paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                    style={{ color: '#8b95a3' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8b95a3' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused(null)}
                    placeholder="Confirm your password"
                    required
                    className="auth-input"
                    style={{ ...inputStyle('confirmPassword'), paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                    style={{ color: '#8b95a3' }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {isLoggedIn && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(132,204,22,0.08)',
                border: '1px solid rgba(132,204,22,0.2)',
              }}
            >
              <p className="text-sm" style={{ color: '#86efac' }}>
                You are logged in as {session?.user?.email}
              </p>
              <p className="text-[13px] mt-2" style={{ color: '#8b95a3' }}>
                Click the button below to accept the team invitation.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 mt-6"
            style={{
              height: '50px',
              fontSize: '14px',
              background: 'linear-gradient(135deg, #0b1520 0%, #172030 50%, #0f1c28 100%)',
              border: '1px solid rgba(160,200,230,0.2)',
              boxShadow: '0 0 20px rgba(140,190,220,0.12), 0 4px 24px rgba(0,0,0,0.55)',
              color: '#ddeef8',
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  {isLoggedIn ? 'Accept Invitation' : 'Create Account & Join'} <ArrowRight size={14} />
                </>
              )}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
