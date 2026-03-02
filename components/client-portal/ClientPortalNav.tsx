'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, FileText, FileCheck, User, Package } from 'lucide-react';

interface ClientPortalNavProps {
  clientName: string;
}

export default function ClientPortalNav({ clientName }: ClientPortalNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError('');
    try {
      const res = await fetch('/api/client-portal/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        setIsLoggingOut(false);
        router.push('/client-portal/login');
      } else {
        setError('Failed to log out. Please try again.');
        setIsLoggingOut(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/client-portal', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client-portal/invoices', label: 'Invoices', icon: FileText },
    { href: '/client-portal/contracts', label: 'Contracts', icon: FileCheck },
    { href: '/client-portal/deliverables', label: 'Deliverables', icon: Package },
    { href: '/client-portal/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className="hidden md:flex fixed top-0 left-0 w-full h-16 items-center justify-between px-6 z-40 border-b"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            <LayoutDashboard size={20} />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Portal
          </h1>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isActive(href) ? 'nav-item active' : 'nav-item'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Client Name & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            {error && <p className="text-xs mb-1" style={{ color: 'var(--accent-red)' }}>{error}</p>}
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {clientName}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Client
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-secondary btn-sm flex items-center gap-2"
            style={{
              opacity: isLoggingOut ? 0.5 : 1,
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className="md:hidden fixed top-0 left-0 w-full h-14 flex items-center justify-between px-4 z-40 border-b"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            <LayoutDashboard size={18} />
          </div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Portal
          </h1>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed top-14 left-0 w-full z-30 border-b"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex flex-col">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b ${
                  isActive(href) ? 'nav-item active' : 'nav-item'
                }`}
                style={{
                  borderColor: 'var(--border-default)',
                  color: isActive(href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {clientName}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Client
              </p>
            </div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              disabled={isLoggingOut}
              className="px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all"
              style={{
                color: 'var(--accent-red)',
                opacity: isLoggingOut ? 0.5 : 1,
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
