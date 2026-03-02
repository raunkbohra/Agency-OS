'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CheckSquare,
  FileSignature,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { SparkleButton } from '@/components/ui/sparkle-button';

const sidebarNav = [
  { icon: LayoutDashboard, label: 'Dashboard', active: false },
  { icon: Users, label: 'Clients', active: false },
  { icon: FileText, label: 'Invoices', active: true },
  { icon: Package, label: 'Plans', active: false },
  { icon: CheckSquare, label: 'Deliverables', active: false },
  { icon: FileSignature, label: 'Contracts', active: false },
  { icon: BarChart3, label: 'Metrics', active: false },
];

const invoiceRows = [
  { client: 'Acme Corp', plan: 'Pro', status: 'paid', amount: '$2,400', date: 'Mar 1' },
  { client: 'DesignStudio', plan: 'Growth', status: 'pending', amount: '$4,800', date: 'Feb 28' },
  { client: 'TechStart Inc', plan: 'Pro', status: 'paid', amount: '$2,400', date: 'Feb 25' },
  { client: 'Media Co', plan: 'Starter', status: 'overdue', amount: '$800', date: 'Feb 20' },
];

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  paid: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', dot: '#22c55e' },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
};

// ─── Desktop mockup (md+) ───────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 lg:px-0">
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{
          transform: 'perspective(1400px) rotateX(4deg)',
          background: 'var(--shell-bg)',
          border: '1px solid var(--shell-border)',
          boxShadow: 'var(--shell-shadow), var(--tint-shadow)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: 'var(--shell-chrome)', borderBottom: '1px solid var(--shell-border)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <div className="flex-1 flex justify-center">
            <div
              className="px-4 py-1 rounded-md flex items-center gap-2"
              style={{ background: 'var(--shell-url-bg)', border: '1px solid var(--shell-border)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              <span className="text-[11px]" style={{ fontFamily: 'monospace', color: 'var(--shell-text)' }}>
                app.agencyos.io/dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard body */}
        <div className="flex" style={{ height: '380px', background: 'var(--app-bg)' }}>
          {/* Sidebar */}
          <div
            className="w-[175px] flex-shrink-0 flex flex-col p-3 gap-0.5"
            style={{ borderRight: '1px solid var(--app-sidebar-border)', background: 'var(--app-sidebar-bg)' }}
          >
            <div className="flex items-center gap-2 px-2 py-2.5 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--app-sidebar-icon-bg)' }}
              >
                <span className="text-white text-[9px] font-bold">A</span>
              </div>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--app-text-primary)' }}>Agency OS</span>
            </div>
            {sidebarNav.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer"
                style={{
                  background: item.active ? 'var(--app-sidebar-item-active-bg)' : 'transparent',
                  color: item.active ? 'var(--app-sidebar-text-active)' : 'var(--app-sidebar-text-inactive)',
                  border: item.active ? '1px solid var(--app-sidebar-item-active-border)' : '1px solid transparent',
                }}
              >
                <item.icon size={12} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[13px] font-semibold" style={{ color: 'var(--app-heading)' }}>Invoices</h2>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-heading-secondary)' }}>18 total · Mar 2026</p>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: 'var(--app-button-bg)',
                  border: '1px solid var(--app-button-border)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'var(--neon-glow)',
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: 'var(--app-button-text)' }}>+ New Invoice</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: 'MRR', value: '$24,800', change: '+12%', icon: TrendingUp },
                { label: 'Active Clients', value: '18', change: '+2 this mo.', icon: Users },
                { label: 'Collection Rate', value: '94.2%', change: '+3% improvement', icon: BarChart3 },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl p-3 transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
                  style={{
                    background: 'var(--app-card-bg)',
                    border: '1px solid var(--app-border)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'var(--neon-glow)',
                  }}
                >
                  <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--app-heading-secondary)' }}>{m.label}</div>
                  <div className="text-[15px] font-bold" style={{ color: 'var(--app-heading)' }}>{m.value}</div>
                  <div className="text-[9px] mt-1" style={{ color: '#22c55e' }}>{m.change}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--app-border)' }}>
              <div
                className="grid grid-cols-4 px-3.5 py-2"
                style={{ background: 'var(--app-table-header-bg)', borderBottom: '1px solid var(--app-border)' }}
              >
                {['Client', 'Plan', 'Status', 'Amount'].map((h) => (
                  <span key={h} className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--app-heading-secondary)' }}>{h}</span>
                ))}
              </div>
              {invoiceRows.map((row, i) => {
                const s = statusConfig[row.status];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-4 px-3.5 py-2.5 items-center transition-all duration-300 hover:bg-opacity-100 cursor-pointer"
                    style={{
                      borderBottom: i < invoiceRows.length - 1 ? '1px solid var(--app-border)' : 'none',
                      backgroundColor: 'var(--app-bg)',
                    }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: 'var(--app-text-primary)' }}>{row.client}</span>
                    <span className="text-[10px]" style={{ color: 'var(--app-heading-secondary)' }}>{row.plan}</span>
                    <div
                      className="flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-[9px] font-semibold capitalize transition-all duration-300"
                      style={{
                        background: s.bg,
                        color: s.color,
                        boxShadow: `0 0 15px ${s.color}30`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: s.dot,
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {row.status}
                    </div>
                    <span className="text-[11px] font-medium" style={{ fontFamily: 'monospace', color: 'var(--app-text-primary)' }}>
                      {row.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat cards — desktop only */}
      <motion.div
        className="absolute -left-4 lg:-left-16 top-1/4 rounded-2xl p-3.5 hidden lg:block transition-all duration-500 hover:scale-110 hover:-translate-y-2"
        style={{
          background: 'var(--float-card-bg)',
          border: '1px solid var(--float-card-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--float-card-shadow), var(--tint-shadow)',
          width: '150px',
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--app-heading-secondary)' }}>Monthly Revenue</div>
        <div className="text-[18px] font-bold" style={{ color: 'var(--app-heading)' }}>$24,800</div>
        <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: '#22c55e' }}>
          <TrendingUp size={9} /> ↑ 12% vs last month
        </div>
      </motion.div>

      <motion.div
        className="absolute -right-4 lg:-right-16 bottom-1/3 rounded-2xl p-3.5 hidden lg:block transition-all duration-500 hover:scale-110 hover:-translate-y-2"
        style={{
          background: 'var(--float-card-bg)',
          border: '1px solid var(--float-card-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--float-card-shadow), var(--tint-shadow)',
          width: '150px',
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="text-[9px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--app-heading-secondary)' }}>Collection Rate</div>
        <div className="text-[18px] font-bold" style={{ color: 'var(--app-heading)' }}>94.2%</div>
        <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: '#22c55e' }}>
          ↑ 3% improvement
        </div>
      </motion.div>

      {/* Bottom glow */}
      <div
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(160,175,190,0.08), rgba(196,208,216,0.05), transparent)', filter: 'blur(40px)' }}
      />
    </div>
  );
}

// ─── Mobile mockup (< md) ────────────────────────────────────────────
function MobileMockup() {
  const metrics = [
    { label: 'MRR', value: '$24.8K', change: '↑ 12%', color: '#22c55e' },
    { label: 'Clients', value: '18', change: '↑ 2 new', color: '#22c55e' },
    { label: 'Collection', value: '94.2%', change: '↑ 3%', color: '#22c55e' },
  ];

  const mobileRows = invoiceRows.slice(0, 3);

  return (
    <div className="relative mx-auto max-w-sm px-4">
      {/* Phone outer shell */}
      <div
        className="relative rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        style={{
          background: 'var(--shell-bg)',
          border: '1px solid var(--shell-border)',
          boxShadow: 'var(--shell-shadow), var(--tint-shadow)',
          backdropFilter: 'var(--glass-blur)',
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 pt-4 pb-2"
          style={{ background: 'var(--shell-chrome)' }}
        >
          <span className="text-[11px] font-semibold" style={{ color: 'var(--shell-text)' }}>9:41</span>
          <div
            className="w-20 h-4 rounded-full"
            style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              {[2, 3, 4, 5].map((h, i) => (
                <div key={i} className="w-0.5 rounded-sm" style={{ height: `${h * 2}px`, background: i < 3 ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="ml-1">
              <rect x="0.5" y="0.5" width="11" height="9" rx="1.5" stroke="white" strokeOpacity="0.5"/>
              <rect x="1.5" y="1.5" width="9" height="7" rx="1" fill="white"/>
              <path d="M12.5 3.5v3a1.5 1.5 0 000-3z" fill="white" fillOpacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* App header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: 'var(--shell-chrome)', borderBottom: '1px solid var(--shell-border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}
            >
              <span className="text-white text-[9px] font-bold">A</span>
            </div>
            <span className="text-[13px] font-semibold text-white">Agency OS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M2 3h8M2 9h5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4" style={{ background: 'var(--app-bg)' }}>

          {/* Page title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[15px] font-bold" style={{ color: 'var(--app-heading)' }}>Invoices</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-heading-secondary)' }}>18 total · Mar 2026</p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
              style={{
                background: 'var(--app-button-bg)',
                border: '1px solid var(--app-button-border)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--neon-glow)',
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: 'var(--app-button-text)' }}>+ New</span>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl p-3 text-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer"
                style={{
                  background: 'var(--app-card-bg)',
                  border: '1px solid var(--app-border)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'var(--neon-glow)',
                }}
              >
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--app-heading-secondary)' }}>{m.label}</div>
                <div className="text-[16px] font-black leading-none mb-1" style={{ color: 'var(--app-heading)' }}>{m.value}</div>
                <div className="text-[9px] font-medium" style={{ color: m.color }}>{m.change}</div>
              </div>
            ))}
          </div>

          {/* Invoice list */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--app-border)' }}
          >
            {mobileRows.map((row, i) => {
              const s = statusConfig[row.status];
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-3.5 py-3 transition-all duration-300 cursor-pointer"
                  style={{
                    borderBottom: i < mobileRows.length - 1 ? '1px solid var(--app-border)' : 'none',
                    backgroundColor: 'var(--app-bg)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--app-text-primary)' }}>{row.client}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-heading-secondary)' }}>{row.plan} · {row.date}</p>
                  </div>
                  <div className="flex items-center gap-2.5 ml-3">
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize transition-all duration-300"
                      style={{
                        background: s.bg,
                        color: s.color,
                        boxShadow: `0 0 15px ${s.color}30`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: s.dot,
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {row.status}
                    </div>
                    <span className="text-[12px] font-bold" style={{ fontFamily: 'monospace', color: 'var(--app-text-primary)' }}>
                      {row.amount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom nav */}
          <div
            className="flex items-center justify-around mt-4 pt-3 pb-1"
            style={{ borderTop: '1px solid var(--app-border)' }}
          >
            {[
              { icon: LayoutDashboard, label: 'Home' },
              { icon: Users, label: 'Clients' },
              { icon: FileText, label: 'Invoices', active: true },
              { icon: BarChart3, label: 'Metrics' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: item.active ? 'var(--app-sidebar-item-active-bg)' : 'transparent',
                    border: item.active ? '1px solid var(--app-sidebar-item-active-border)' : '1px solid transparent',
                  }}
                >
                  <item.icon size={15} style={{ color: item.active ? 'var(--app-sidebar-text-active)' : 'var(--app-sidebar-text-inactive)' }} />
                </div>
                <span className="text-[9px]" style={{ color: item.active ? 'var(--app-sidebar-text-active)' : 'var(--app-sidebar-text-inactive)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-3 pt-1" style={{ background: 'var(--app-bg)' }}>
          <div className="w-24 h-1 rounded-full" style={{ background: 'var(--shell-text)' }} />
        </div>
      </div>

      {/* Glow under phone */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-2/3 h-24 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(160,175,190,0.1), transparent)', filter: 'blur(30px)' }}
      />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────
export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(107,126,147,0.08) 0%, rgba(143,160,176,0.04) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(143,160,176,0.06), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)',
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Headline */}
        <motion.div
          className="mt-8 space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1
            className="text-4xl sm:text-5xl md:text-[76px] font-black leading-[1.0] tracking-[-0.04em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Run your agency
          </h1>
          <h1
            className="text-4xl sm:text-5xl md:text-[76px] font-black leading-[1.0] tracking-[-0.04em]"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'linear-gradient(135deg, #8fa4b8 0%, #dde6ed 50%, #a8bbc8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            from one system.
          </h1>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-base sm:text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          Plans, clients, invoices, deliverables, and contracts — all in one place. Built for agencies that ship.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-7 flex items-center justify-center gap-3 flex-wrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <SparkleButton href="/auth/signin">
            Get Started Free
            <ArrowRight size={15} />
          </SparkleButton>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'var(--landing-card-bg)',
              border: '1px solid var(--landing-card-border)',
              color: 'var(--landing-secondary-btn-color)',
            }}
          >
            See how it works
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="mt-5 flex items-center justify-center gap-1.5 text-xs flex-wrap"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <span>Free to start</span>
          <span>·</span>
          <span>No credit card required</span>
          <span>·</span>
          <span>Setup in 5 minutes</span>
        </motion.div>
      </div>

      {/* Mockup — phone on mobile, desktop browser on md+ */}
      <motion.div
        className="relative z-10 w-full mt-12 md:mt-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <div className="md:hidden">
          <MobileMockup />
        </div>
        <div className="hidden md:block">
          <DashboardMockup />
        </div>
      </motion.div>
    </section>
  );
}
