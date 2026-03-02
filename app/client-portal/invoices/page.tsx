'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientPortalLayout from '@/components/client-portal/ClientPortalLayout';
import ClientPortalInvoices from '@/components/client-portal/ClientPortalInvoices';

interface ClientProfile {
  id: string;
  name: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/client-portal/me/profile');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/client-portal/login');
            return;
          }
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data.client);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientPortalLayout
      clientName={profile.name}
      title="Invoices"
      subtitle="View and download your invoices"
    >
      <div
        className="rounded-lg border p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <ClientPortalInvoices />
      </div>
    </ClientPortalLayout>
  );
}
