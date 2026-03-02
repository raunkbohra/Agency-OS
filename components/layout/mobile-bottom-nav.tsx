'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { href: '/dashboard/metrics', icon: BarChart3, label: 'Metrics' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-2 py-3 border-t"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-default)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-110"
            style={{
              background: active ? 'rgba(143, 160, 176, 0.15)' : 'transparent',
              border: active ? '1px solid rgba(143, 160, 176, 0.25)' : '1px solid transparent',
            }}
          >
            <div className="flex items-center justify-center w-6 h-6">
              <item.icon
                size={20}
                style={{
                  color: active ? '#b0bec8' : '#6b7280',
                }}
              />
            </div>
            <span
              className="text-[9px] font-medium"
              style={{
                color: active ? '#8fa0b0' : '#6b7280',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
