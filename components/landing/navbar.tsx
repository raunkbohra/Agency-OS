'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0070f3, #7c3aed)' }}
          >
            <span className="text-white font-bold text-[11px] tracking-tight">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight text-sm">Agency OS</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Link
            href="/auth/signin"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signin"
            className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 hover:scale-[0.98] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0070f3, #7c3aed)',
              boxShadow: '0 0 20px rgba(0, 112, 243, 0.3)',
            }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
