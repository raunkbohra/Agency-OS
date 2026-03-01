'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AVAILABLE_PROVIDERS = [
  { id: 'bank_transfer', name: 'Bank Transfer', requiresSetup: false },
  { id: 'fonepay', name: 'FonePay', requiresSetup: true },
  { id: 'stripe', name: 'Stripe', requiresSetup: true },
  { id: 'razorpay', name: 'Razorpay', requiresSetup: true },
  { id: 'esewa', name: 'Esewa', requiresSetup: true },
];

const CREDENTIAL_FIELDS: Record<string, { label: string; key: string; type: string }[]> = {
  fonepay: [
    { label: 'API Key', key: 'apiKey', type: 'password' },
    { label: 'Merchant ID', key: 'merchantId', type: 'text' },
  ],
  stripe: [
    { label: 'API Key', key: 'apiKey', type: 'password' },
  ],
  razorpay: [
    { label: 'Key ID', key: 'keyId', type: 'text' },
    { label: 'Key Secret', key: 'keySecret', type: 'password' },
  ],
  esewa: [
    { label: 'Merchant Code', key: 'merchantCode', type: 'text' },
    { label: 'Secret', key: 'secret', type: 'password' },
  ],
};

interface PaymentMethod {
  id: string;
  provider_id: string;
  enabled: boolean;
  created_at: Date | string;
}

export default function PaymentMethodsManager({
  initialMethods,
}: {
  initialMethods: PaymentMethod[];
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          credentials: formData,
        }),
      });

      if (res.ok) {
        setFormData({});
        setShowForm(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (methodId: string, currentEnabled: boolean) => {
    const res = await fetch(`/api/settings/payments/${methodId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !currentEnabled }),
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {AVAILABLE_PROVIDERS.map(provider => {
        const existing = methods.find(m => m.provider_id === provider.id);

        return (
          <div key={provider.id} className="bg-bg-secondary rounded-lg p-6 border border-border-default">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">{provider.name}</h3>
              {existing && (
                <button
                  onClick={() => handleToggle(existing.id, existing.enabled)}
                  className={`px-4 py-2 rounded text-white ${
                    existing.enabled ? 'bg-accent-green hover:bg-accent-green/90' : 'bg-text-tertiary hover:bg-text-secondary'
                  }`}
                >
                  {existing.enabled ? 'Enabled' : 'Disabled'}
                </button>
              )}
            </div>

            {!existing && provider.requiresSetup && (
              <>
                {showForm === provider.id ? (
                  <div className="space-y-4">
                    {CREDENTIAL_FIELDS[provider.id]?.map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.key]: e.target.value,
                            })
                          }
                          className="w-full border border-border-default rounded p-2 bg-bg-tertiary text-text-primary"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddProvider(provider.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-accent-blue text-white rounded hover:bg-accent-blue/90 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setShowForm(null)}
                        className="px-4 py-2 border border-border-default rounded hover:bg-bg-hover text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowForm(provider.id)}
                    className="text-accent-blue hover:underline"
                  >
                    Configure →
                  </button>
                )}
              </>
            )}

            {existing && (
              <p className="text-sm text-text-secondary">
                Configured on {
                  existing.created_at instanceof Date
                    ? existing.created_at.toLocaleDateString()
                    : new Date(existing.created_at).toLocaleDateString()
                }
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
