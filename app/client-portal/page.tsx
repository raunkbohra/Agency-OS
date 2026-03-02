'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientPortalLayout from '@/components/client-portal/ClientPortalLayout';
import ClientPortalDeliverables from '@/components/client-portal/ClientPortalDeliverables';
import { Package, FileText, Inbox } from 'lucide-react';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
}

interface StatsData {
  totalDeliverables: number;
  totalInvoices: number;
  pendingItems: number;
}

export default function ClientPortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalDeliverables: 0,
    totalInvoices: 0,
    pendingItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/client-portal/me/profile');
        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            router.push('/client-portal/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }
        const profileData = await profileRes.json();
        setProfile(profileData.client);

        // Fetch deliverables for stats
        const delivRes = await fetch('/api/client-portal/me/deliverables');
        const delivData = delivRes.ok ? await delivRes.json() : { deliverables: [] };

        // Fetch invoices for stats
        const invRes = await fetch('/api/client-portal/me/invoices');
        const invData = invRes.ok ? await invRes.json() : { invoices: [] };

        const deliverables = delivData.deliverables || [];
        const invoices = invData.invoices || [];

        setStats({
          totalDeliverables: deliverables.length,
          totalInvoices: invoices.length,
          pendingItems: deliverables.filter((d: any) => d.status === 'pending').length,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--accent-red)' }}>Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <ClientPortalLayout
      clientName={profile.name}
      title={`Welcome back, ${profile.name}!`}
      subtitle="Here's an overview of your account"
    >
      {error && (
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            color: 'var(--accent-red)',
          }}
        >
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {/* Total Deliverables */}
        <div
          className="rounded-lg border p-6"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Total Deliverables
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {stats.totalDeliverables}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(107, 126, 147, 0.1)' }}
            >
              <Package size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
          </div>
        </div>

        {/* Total Invoices */}
        <div
          className="rounded-lg border p-6"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Total Invoices
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {stats.totalInvoices}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(107, 126, 147, 0.1)' }}
            >
              <FileText size={24} style={{ color: 'var(--accent-blue)' }} />
            </div>
          </div>
        </div>

        {/* Pending Items */}
        <div
          className="rounded-lg border p-6"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Pending Items
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {stats.pendingItems}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255, 179, 0, 0.1)' }}
            >
              <Inbox size={24} style={{ color: 'var(--accent-amber)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliverables */}
      <div>
        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Recent Deliverables
        </h2>
        <div
          className="rounded-lg border p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-default)',
          }}
        >
          <ClientPortalDeliverables />
        </div>
      </div>
    </ClientPortalLayout>
  );
}
