'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import JoinTeamForm from '@/components/JoinTeamForm';

export default function JoinTeamPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvite() {
      try {
        // Validate token exists
        if (!token) {
          throw new Error('No invite token provided');
        }
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--accent-red)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return <JoinTeamForm token={token} />;
}
