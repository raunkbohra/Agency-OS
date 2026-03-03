'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  color?: string;
  onClick?: () => void;
  isPending?: boolean;
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  color,
  onClick,
  isPending,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast',
        isActive
          ? 'text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        isPending && 'opacity-50'
      )}
    >
      {(isActive || isPending) && (
        <motion.div
          layoutId="sidebar-active"
          className={cn(
            'absolute inset-0 rounded-md border border-border-default',
            isPending ? 'bg-bg-hover animate-pulse' : 'bg-bg-tertiary'
          )}
          style={{ boxShadow: isPending ? undefined : '0 0 12px rgba(143,160,176,0.12)' }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}
      {isPending ? (
        <Loader2 className="relative z-10 h-4 w-4 animate-spin" style={{ color: color ?? undefined }} />
      ) : (
        <Icon className="relative z-10 h-4 w-4" style={{ color: color ?? undefined }} />
      )}
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
