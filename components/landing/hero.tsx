'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl mt-16 px-4">
      <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden shadow-2xl shadow-black/50"
        style={{ transform: 'perspective(1000px) rotateX(2deg)' }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-primary">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-6 rounded-md bg-bg-tertiary max-w-xs mx-auto" />
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['Revenue', 'Clients', 'Deliverables', 'Plans'].map((label) => (
              <div key={label} className="rounded-lg border border-border-default bg-bg-primary p-4">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">{label}</div>
                <div className="h-5 w-16 rounded bg-bg-tertiary" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border-default overflow-hidden">
            <div className="bg-bg-tertiary px-4 py-2 flex gap-16">
              {['Client', 'Plan', 'Status', 'Amount'].map((h) => (
                <div key={h} className="text-[10px] text-text-tertiary font-medium uppercase tracking-wide">{h}</div>
              ))}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-4 py-3 border-t border-border-default flex gap-16 items-center">
                <div className="h-3 w-20 rounded bg-bg-tertiary" />
                <div className="h-3 w-16 rounded bg-bg-tertiary" />
                <div className="h-5 w-14 rounded-full bg-accent-green/10" />
                <div className="h-3 w-12 rounded bg-bg-tertiary" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-accent-blue/5 blur-3xl rounded-full" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 bg-dot-grid overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-blue/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            Built for modern agencies
          </span>
        </motion.div>
        <motion.h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.1]"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          Run your agency
        </motion.h1>
        <motion.h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.1] gradient-text-subtle"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          from one system
        </motion.h1>
        <motion.p className="mt-6 text-lg md:text-xl text-text-secondary max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          Plans, clients, invoices, deliverables, and contracts — all in one place. Built for agencies that ship.
        </motion.p>
        <motion.div className="mt-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <Button variant="primary" size="lg" asChild>
            <Link href="/auth/signin">Get Started</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#features">See how it works</Link>
          </Button>
        </motion.div>
      </div>
      <motion.div className="relative z-10 w-full"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}>
        <DashboardMockup />
      </motion.div>
    </section>
  );
}
