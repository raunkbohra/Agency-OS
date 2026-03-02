'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Derive a clean page title — skip dynamic ID segments (UUIDs / numeric IDs)
  const segments = pathname.split('/').filter(Boolean);
  const isId = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || /^\d+$/.test(s);
  const relevant = [...segments].reverse().find((s) => !isId(s)) ?? 'dashboard';
  const pageTitle = relevant.charAt(0).toUpperCase() + relevant.slice(1);

  return (
    <>
      {/* Mobile top bar — visible only below lg */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-default)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="h-7 w-7 rounded-lg bg-accent-blue flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-sm text-text-primary tracking-tight">Agency OS</span>
        </Link>

        {/* Page title — center */}
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-text-primary capitalize">
          {pageTitle === 'Dashboard' ? '' : pageTitle}
        </span>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg transition-colors hover:bg-bg-hover"
          style={{ border: '1px solid var(--border-default)' }}
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4 text-text-primary" />
        </button>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar onNavClick={() => setOpen(false)} />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3.5 right-3 p-1.5 rounded-md hover:bg-bg-hover transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
