'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, ShieldCheck, Clock, Lock } from 'lucide-react';

interface Sparkle {
  id: number; x: number; y: number; size: number;
  delay: number; duration: number; opacity: number;
}

function makeSparkles(count: number): Sparkle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 4 + Math.random() * 92,
    y: 4 + Math.random() * 92,
    size: Math.random() < 0.12 ? 3 : Math.random() < 0.35 ? 2 : 1.5,
    delay: Math.random() * 3.5,
    duration: 1.0 + Math.random() * 2.0,
    opacity: 0.55 + Math.random() * 0.45,
  }));
}

function SparkleParticles({ count }: { count: number }) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  useEffect(() => { setSparkles(makeSparkles(count)); }, [count]);
  return (
    <>
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          aria-hidden
          style={{
            position: 'absolute',
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            borderRadius: '50%',
            background: s.size >= 3 ? '#ffffff' : '#c8e0f0',
            boxShadow: s.size >= 2 ? `0 0 ${s.size * 3}px rgba(200,230,248,0.9)` : 'none',
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0, s.opacity, 0], scale: [0.2, 1, 0.2] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  );
}

const securityPoints = [
  { icon: ShieldCheck, title: 'Secure link', desc: 'Reset links expire in 1 hour for your safety' },
  { icon: Clock, title: 'Quick recovery', desc: 'Email arrives within seconds, check spam if needed' },
  { icon: Lock, title: 'Your data is safe', desc: 'We never store passwords in plain text' },
];

function SecurityPanel() {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, #07080d 0%, #0b1017 55%, #060c12 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 65% at 30% 45%, rgba(107,126,147,0.1) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        maskImage: 'radial-gradient(ellipse 85% 85% at 40% 50%, black 30%, transparent 100%)',
      }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(160,185,210,0.15), transparent)',
      }} />

      <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-2.5"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}>
            <span className="text-white font-bold text-[11px]">A</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Agency OS</span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7"
              style={{
                background: 'rgba(107,126,147,0.1)',
                border: '1px solid rgba(107,126,147,0.2)',
                boxShadow: '0 0 40px rgba(107,126,147,0.1)',
              }}
            >
              <Mail size={22} style={{ color: '#b0bec8' }} />
            </div>

            <h2
              className="text-[36px] xl:text-[42px] font-black leading-[1.05] tracking-[-0.035em] text-white mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              We&apos;ve got
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #8fa4b8 0%, #dde6ed 45%, #a8bbc8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                you covered.
              </span>
            </h2>
            <p className="text-sm leading-relaxed mb-10" style={{ color: '#6b7280', maxWidth: '290px' }}>
              Happens to everyone. Enter your email and we&apos;ll send you a secure link to reset your password.
            </p>

            <div className="space-y-4">
              {securityPoints.map((pt, i) => (
                <motion.div
                  key={pt.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.09 }}
                  className="flex items-start gap-3.5"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(160,180,200,0.08)', border: '1px solid rgba(160,180,200,0.1)' }}
                  >
                    <pt.icon size={13} style={{ color: '#8fa4b8' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{pt.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#8b95a3' }}>{pt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="flex items-center gap-2 mt-auto"
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
          <p className="text-xs" style={{ color: '#8b95a3' }}>
            All data encrypted with <span style={{ color: '#6b7e93' }}>AES-256</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
      } else {
        setSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '50px',
    padding: '0 16px',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#e2eaf0',
    background: focused ? 'rgba(180,200,220,0.07)' : 'rgba(255,255,255,0.03)',
    border: focused ? '1px solid rgba(180,205,225,0.38)' : '1px solid rgba(255,255,255,0.1)',
    outline: 'none',
    transition: 'all 0.18s ease',
    boxShadow: focused ? '0 0 0 3px rgba(160,190,215,0.08)' : 'none',
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#060609' }}>
      <style>{`
        .auth-input::placeholder { color: #8b95a3; }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0d1520 inset !important;
          -webkit-text-fill-color: #e2eaf0 !important;
          caret-color: #e2eaf0;
        }
      `}</style>

      <div className="hidden lg:block lg:w-[54%] xl:w-[56%]">
        <SecurityPanel />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(107,126,147,0.05) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-[360px]"
        >
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}>
              <span className="text-white font-bold text-[11px]">A</span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Agency OS</span>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
                <div className="mb-8">
                  <h1 className="text-[26px] font-black tracking-[-0.03em] text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Reset password
                  </h1>
                  <p className="mt-1.5 text-sm" style={{ color: '#6b7280' }}>
                    Enter your email and we&apos;ll send a reset link
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#8b95a3' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="you@agency.com"
                      required
                      autoFocus
                      className="auth-input"
                      style={inputStyle}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      height: '50px',
                      fontSize: '14px',
                      background: 'linear-gradient(135deg, #0b1520 0%, #172030 50%, #0f1c28 100%)',
                      border: '1px solid rgba(160,200,230,0.2)',
                      boxShadow: '0 0 20px rgba(140,190,220,0.12), 0 4px 24px rgba(0,0,0,0.55)',
                      color: '#ddeef8',
                    }}
                  >
                    <SparkleParticles count={24} />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <>Send reset link <Mail size={14} /></>
                      )}
                    </span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: 'rgba(107,126,147,0.1)',
                    border: '1px solid rgba(107,126,147,0.25)',
                    boxShadow: '0 0 30px rgba(107,126,147,0.1)',
                  }}
                >
                  <Mail size={22} style={{ color: '#b0bec8' }} />
                </div>
                <h2 className="text-[22px] font-black tracking-[-0.03em] text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Check your inbox
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  If an account exists for{' '}
                  <span className="text-white font-medium">{email}</span>
                  , a reset link has been sent.
                </p>
                <p className="text-xs mt-5" style={{ color: '#6b7280' }}>
                  Didn&apos;t receive it? Check your spam folder or{' '}
                  <button onClick={() => setSent(false)} className="underline transition-colors hover:text-white" style={{ color: '#8fa0b0' }}>
                    try again
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-white"
              style={{ color: '#8b95a3' }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
