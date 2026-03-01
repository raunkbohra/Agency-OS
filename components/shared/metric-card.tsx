'use client';

import { AnimatedNumber } from './animated-number';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'percentage' | 'integer';
  prefix?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  className?: string;
}

export function MetricCard({ label, value, format = 'integer', prefix, trend, className }: MetricCardProps) {
  return (
    <div className={`group relative rounded-lg border border-border-default bg-bg-secondary p-5 transition-all duration-200 hover:border-border-hover hover:-translate-y-px overflow-hidden ${className || ''}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-blue/40 to-transparent" />
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <AnimatedNumber
          value={value}
          format={format}
          prefix={prefix}
          className="text-2xl font-semibold tracking-tight text-text-primary"
        />
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trend.direction === 'up' ? 'text-accent-green' : 'text-accent-red'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
