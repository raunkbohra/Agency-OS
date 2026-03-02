'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, BarChart3, CheckCircle2, Zap } from 'lucide-react';

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

const showcaseMetrics = [
  {
    icon: TrendingUp,
    label: 'Monthly Revenue',
    value: '$24,800',
    change: '+12%',
    sub: 'vs last month',
  },
  {
    icon: Users,
    label: 'Active Clients',
    value: '18',
    change: '+2',
    sub: 'this month',
  },
  {
    icon: BarChart3,
    label: 'Collection Rate',
    value: '94.2%',
    change: '+3%',
    sub: 'improvement',
  },
];

const features = [
  { icon: CheckCircle2, text: 'Invoicing & payment tracking' },
  { icon: CheckCircle2, text: 'Client & contract management' },
  { icon: CheckCircle2, text: 'Deliverables & metrics dashboard' },
];

function ProductPanel() {
  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(155deg, #07080d 0%, #0b1017 55%, #070c13 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      {/* Layered atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 70% at 20% 30%, rgba(107,126,147,0.11) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 80% 85%, rgba(143,160,176,0.07) 0%, transparent 65%)',
      }} />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        maskImage: 'radial-gradient(ellipse 85% 85% at 40% 50%, black 30%, transparent 100%)',
      }} />
      {/* Subtle horizontal rule accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(160,185,210,0.18), transparent)',
      }} />

      <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-2.5"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}
          >
            <span className="text-white font-bold text-[11px]">A</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Agency OS</span>
        </motion.div>

        {/* Main copy */}
        <motion.div
          className="mt-auto mb-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
          >
            <Zap size={9} style={{ color: '#8fa0b0' }} />
            Your command center
          </div>
          <h2
            className="text-[38px] xl:text-[46px] font-black leading-[1.04] tracking-[-0.035em] text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Run smarter.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #8fa4b8 0%, #dde6ed 45%, #a8bbc8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Ship faster.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#6b7280', maxWidth: '300px' }}>
            Plans, clients, invoices, deliverables, contracts — all in one place.
          </p>

          {/* Feature list */}
          <ul className="mt-5 space-y-2">
            {features.map((f, i) => (
              <motion.li
                key={f.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-2"
              >
                <f.icon size={12} style={{ color: '#6b8fa0', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: '#555568' }}>{f.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Metric cards */}
        <div className="space-y-2.5">
          {showcaseMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.45 + i * 0.09 }}
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.065)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(160,180,200,0.08)', border: '1px solid rgba(160,180,200,0.1)' }}
              >
                <m.icon size={13} style={{ color: '#8fa4b8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#44445a' }}>
                  {m.label}
                </p>
                <p
                  className="text-[16px] font-black text-white leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {m.value}
                </p>
              </div>
              <div
                className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}
              >
                ↑ {m.change} {m.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="mt-7 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {['#6b7e93', '#8fa0b0', '#a0b4c4', '#c4d0d8'].map((bg, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                style={{ background: bg, borderColor: '#07080d', fontSize: '8px', fontWeight: 700, color: 'white' }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#44445a' }}>
            Trusted by <span style={{ color: '#8fa0b0' }}>500+ agencies</span> globally
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%',
    height: '50px',
    padding: '0 16px',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#e2eaf0',
    background: focused === name ? 'rgba(180,200,220,0.07)' : 'rgba(255,255,255,0.03)',
    border: focused === name
      ? '1px solid rgba(180,205,225,0.38)'
      : '1px solid rgba(255,255,255,0.1)',
    outline: 'none',
    transition: 'all 0.18s ease',
    boxShadow: focused === name ? '0 0 0 3px rgba(160,190,215,0.08), inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#060609' }}>
      {/* Input placeholder color override */}
      <style>{`
        .auth-input::placeholder { color: #3a3a50; }
        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0d1520 inset !important;
          -webkit-text-fill-color: #e2eaf0 !important;
          caret-color: #e2eaf0;
        }
      `}</style>

      {/* Left: Product showcase */}
      <div className="hidden lg:block lg:w-[54%] xl:w-[56%]">
        <ProductPanel />
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(107,126,147,0.055) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-[360px]"
        >
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}>
              <span className="text-white font-bold text-[11px]">A</span>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Agency OS</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-[26px] font-black tracking-[-0.03em] text-white leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: '#6b7280' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
            style={{
              height: '46px',
              background: 'linear-gradient(135deg, rgba(160,180,200,0.11) 0%, rgba(100,120,145,0.06) 100%)',
              border: '1px solid rgba(180,200,220,0.22)',
              color: '#c4d0d8',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
            }}
          >
            {googleLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[11px] font-medium" style={{ color: '#333348' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                }}
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label
                className="block text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: '#44445a' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@agency.com"
                required
                autoFocus
                className="auth-input"
                style={inputStyle('email')}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: '#44445a' }}
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] transition-colors hover:text-white"
                  style={{ color: '#8fa0b0' }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="Enter your password"
                required
                className="auth-input"
                style={inputStyle('password')}
              />
            </div>

            {/* Sign In — sparkle night-sky button */}
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
              <SparkleParticles count={28} />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>Sign in <ArrowRight size={14} /></>
                )}
              </span>
            </button>
          </form>

          <p className="text-center text-[13px] mt-7" style={{ color: '#44445a' }}>
            No account yet?{' '}
            <Link
              href="/auth/signup"
              className="font-semibold transition-colors hover:text-white"
              style={{ color: '#b0bec8' }}
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
