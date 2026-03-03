// app/dashboard/settings/billing/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Subscription {
  tier: string;
  billing_period: string;
  currency: string;
  amount_cents: number;
  status: string;
  current_period_end: string;
  max_clients: number;
  max_plans: number;
  max_team_members: number;
  id?: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (loading) {
    return <div className="p-6">Loading billing information...</div>;
  }

  const currentTier = subscription?.tier || 'free';
  const status = subscription?.status || 'active';
  const amount = subscription ? (subscription.amount_cents / 100).toFixed(2) : '0';
  const period = subscription?.billing_period || 'monthly';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Billing & Subscription
      </h1>

      {/* Current Plan */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background: 'var(--landing-card-bg)',
          border: '1px solid var(--landing-card-border)',
        }}
      >
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize' }}>
          Current Plan: {currentTier}
        </h2>

        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
          <p>
            <strong>Status:</strong> <span style={{ color: status === 'active' ? '#10b981' : '#ef4444' }}>{status}</span>
          </p>
          <p>
            <strong>Billing Period:</strong> {period === 'yearly' ? 'Yearly' : 'Monthly'}
          </p>
          {subscription && (
            <>
              <p>
                <strong>Amount:</strong> {subscription.currency} {amount}/{period === 'yearly' ? 'year' : 'month'}
              </p>
              <p>
                <strong>Renewal Date:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
              <p style={{ marginTop: '1rem' }}>
                <strong>Limits:</strong>
              </p>
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Clients: {subscription.max_clients || '∞'}</li>
                <li>Projects: {subscription.max_plans || '∞'}</li>
                <li>Team Members: {subscription.max_team_members || '∞'}</li>
              </ul>
            </>
          )}
        </div>

        {currentTier !== 'free' && (
          <button
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
            onClick={() => {
              if (confirm('Are you sure you want to cancel your subscription?')) {
                fetch(`/api/subscriptions/${subscription?.id}`, { method: 'DELETE' })
                  .then(() => {
                    alert('Subscription cancelled');
                    window.location.reload();
                  })
                  .catch((error) => console.error('Failed to cancel:', error));
              }
            }}
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Upgrade */}
      {currentTier === 'free' && (
        <div
          className="rounded-xl p-6"
          style={{
            background: 'var(--landing-card-bg)',
            border: '1px solid var(--accent-blue)',
          }}
        >
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Upgrade Your Plan
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Unlock more clients, projects, and team members with a paid plan.
          </p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
