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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/plans', icon: Package, label: 'Plans' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { href: '/dashboard/deliverables', icon: CreditCard, label: 'Deliverables' },
  { href: '/dashboard/contracts', icon: FileSignature, label: 'Contracts' },
  { href: '/dashboard/metrics', icon: BarChart3, label: 'Metrics' },
];

const bottomItems = [
  { href: '/dashboard/settings/payments', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
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
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-default px-3 py-3 space-y-1">
        {bottomItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-fast"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
