'use client';

import { useEffect, useState } from 'react';

interface Metrics {
  mrr: number;
  arr: number;
  collectionRate: number;
  outstandingValue: number;
  completionPercentage: number;
  onTimePercentage: number;
  avgDaysToComplete: number;
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

  if (loading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>Failed to load metrics</div>;

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Financial Metrics</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.mrr).toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Annual Recurring Revenue</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.arr).toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="text-3xl font-bold mt-2">{metrics.collectionRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Outstanding Invoices</p>
            <p className="text-3xl font-bold mt-2">₹{Math.round(metrics.outstandingValue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div>
        <h2 className="text-xl font-bold mb-4">Operational Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Deliverable Completion</p>
            <p className="text-3xl font-bold mt-2">{metrics.completionPercentage}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">On-Time Delivery Rate</p>
            <p className="text-3xl font-bold mt-2">{metrics.onTimePercentage}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600">Avg Days to Complete</p>
            <p className="text-3xl font-bold mt-2">{metrics.avgDaysToComplete} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
