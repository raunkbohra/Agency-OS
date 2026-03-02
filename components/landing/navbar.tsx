'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { SparkleButtonSm } from '@/components/ui/sparkle-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSignedIn = status === 'authenticated' && !!session;

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'backdrop-blur-2xl' : 'bg-transparent'
      )}
      style={scrolled ? { background: 'var(--navbar-scrolled-bg)', borderBottom: '1px solid var(--landing-divider)' } : {}}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)' }}
          >
            <span className="text-white font-bold text-[11px] tracking-tight">A</span>
          </div>
          <span className="font-semibold tracking-tight text-sm" style={{ color: 'var(--text-primary)' }}>Agency OS</span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = 'var(--text-primary)';
                el.style.background = 'var(--landing-badge-bg)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = 'var(--text-secondary)';
                el.style.background = 'transparent';
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {status === 'loading' ? (
            <div className="w-20 h-8 rounded-lg animate-pulse" style={{ background: 'var(--landing-badge-bg)' }} />
          ) : isSignedIn ? (
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--landing-badge-bg)',
                border: '1px solid var(--landing-badge-border)',
                color: 'var(--text-primary)',
              }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)', color: '#fff' }}
              >
                {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span>Open app</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-secondary)' }} className="group-hover:translate-x-0.5 transition-transform duration-200">
                <path d="M2.5 6h7m0 0L6.5 3m3 3L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
              >
                Sign in
              </Link>
              <SparkleButtonSm href="/auth/signup">
                Get Started
              </SparkleButtonSm>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200"
            style={{
              background: 'var(--landing-badge-bg)',
              border: '1px solid var(--landing-badge-border)',
              color: 'var(--text-primary)',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-1"
          style={{
            background: 'var(--navbar-scrolled-bg)',
            borderColor: 'var(--landing-divider)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t space-y-2" style={{ borderColor: 'var(--landing-divider)' }}>
            {status === 'loading' ? (
              <div className="w-full h-10 rounded-lg animate-pulse" style={{ background: 'var(--landing-badge-bg)' }} />
            ) : isSignedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  color: 'var(--text-primary)',
                  background: 'var(--landing-badge-bg)',
                  border: '1px solid var(--landing-badge-border)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6b7e93, #8fa0b0)', color: '#fff' }}
                >
                  {session.user?.name?.[0]?.toUpperCase() ?? session.user?.email?.[0]?.toUpperCase() ?? 'A'}
                </div>
                Open app
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-3 py-2.5 text-sm font-medium rounded-lg"
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--landing-badge-bg)',
                    border: '1px solid var(--landing-badge-border)',
                  }}
                >
                  Sign in
                </Link>
                <div className="flex justify-center">
                  <SparkleButtonSm href="/auth/signup">
                    Get Started
                  </SparkleButtonSm>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
