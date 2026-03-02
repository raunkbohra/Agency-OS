'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface Metrics {
  mrr: number;
  arr: number;
  collectionRate: number;
  outstandingValue: number;
  completionPercentage: number;
  onTimePercentage: number;
  avgDaysToComplete: number;
}

function MetricTile({ label, value, sub, icon: Icon, accent }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      className="bg-bg-secondary rounded-xl border border-border-default p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        {sub && <p className="text-xs text-text-tertiary mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function MetricsDashboard({ agencyId }: { agencyId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    };
    fetchMetrics();
  }, [agencyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
        Failed to load metrics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial */}
      <div>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Financial</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile
            label="Monthly Recurring Revenue"
            value={`₹${Math.round(metrics.mrr).toLocaleString()}`}
            sub="MRR"
            icon={TrendingUp}
            accent="#3b82f6"
          />
          <MetricTile
            label="Annual Recurring Revenue"
            value={`₹${Math.round(metrics.arr).toLocaleString()}`}
            sub="ARR"
            icon={BarChart3}
            accent="#8b5cf6"
          />
          <MetricTile
            label="Collection Rate"
            value={`${metrics.collectionRate}%`}
            sub="of invoices collected"
            icon={CheckCircle2}
            accent="#22c55e"
          />
          <MetricTile
            label="Outstanding Invoices"
            value={`₹${Math.round(metrics.outstandingValue).toLocaleString()}`}
            sub="pending collection"
            icon={AlertCircle}
            accent="#f59e0b"
          />
        </div>
      </div>

      {/* Operational */}
      <div>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Operational</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricTile
            label="Deliverable Completion"
            value={`${metrics.completionPercentage}%`}
            sub="across all clients"
            icon={Zap}
            accent="#06b6d4"
          />
          <MetricTile
            label="On-Time Delivery Rate"
            value={`${metrics.onTimePercentage}%`}
            sub="delivered on schedule"
            icon={CheckCircle2}
            accent="#22c55e"
          />
          <MetricTile
            label="Avg Days to Complete"
            value={`${metrics.avgDaysToComplete}`}
            sub="days per deliverable"
            icon={Clock}
            accent="#8fa0b0"
          />
        </div>
      </div>
    </div>
  );
}
