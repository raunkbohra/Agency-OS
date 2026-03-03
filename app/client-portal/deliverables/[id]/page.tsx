'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ClientPortalLayout from '@/components/client-portal/ClientPortalLayout';
import ClientPortalDeliverableDetail from '@/components/client-portal/ClientPortalDeliverableDetail';

interface ClientProfile {
  id: string;
  name: string;
}

export default function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [deliverableId, setDeliverableId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initPage = async () => {
      try {
        // Get params
        const { id } = await params;
        setDeliverableId(id);

        // Fetch profile to verify auth
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
        console.error('Error initializing page:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [params, router]);

  if (loading || !deliverableId || !profile) {
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
      title="Deliverable Details"
      subtitle="View deliverable information and progress"
    >
      <div className="mb-6">
        <Link
          href="/client-portal/deliverables"
          className="inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--accent-blue)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Deliverables
        </Link>
      </div>

      <div
        className="rounded-lg border p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <ClientPortalDeliverableDetail deliverableId={deliverableId} />
      </div>
    </ClientPortalLayout>
  );
}
