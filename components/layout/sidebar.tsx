'use client';

import Link from 'next/link';
import { SidebarNavItem } from './sidebar-nav-item';
import { MagneticHover } from '@/components/motion/magnetic-hover';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CreditCard,
  FileSignature,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#8fa0b0' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients', color: '#8fa0b0' },
  { href: '/dashboard/plans', icon: Package, label: 'Plans', color: '#8fa0b0' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices', color: '#8fa0b0' },
  { href: '/dashboard/deliverables', icon: CreditCard, label: 'Deliverables', color: '#8fa0b0' },
  { href: '/dashboard/contracts', icon: FileSignature, label: 'Contracts', color: '#8fa0b0' },
  { href: '/dashboard/metrics', icon: BarChart3, label: 'Metrics', color: '#8fa0b0' },
];

const bottomItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', color: '#8fa0b0' },
];

export function Sidebar({ onNavClick }: { onNavClick?: () => void } = {}) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-sidebar flex-col border-r border-border-default bg-bg-primary">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-border-default">
        <MagneticHover strength={0.2}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent-blue flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-text-primary tracking-tight">Agency OS</span>
          </Link>
        </MagneticHover>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          Workspace
        </p>
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} onClick={onNavClick} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-default px-3 py-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-text-tertiary">Theme</span>
          <ThemeToggle />
        </div>
        {bottomItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} onClick={onNavClick} />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-fast"
        >
          <LogOut className="h-4 w-4" style={{ color: '#8fa0b0' }} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
