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
    <div className="space-y-3">
      {AVAILABLE_PROVIDERS.map(provider => {
        const existing = methods.find(m => m.provider_id === provider.id);

        return (
          <div key={provider.id} className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{provider.name}</h3>
                {existing && (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Configured {
                      existing.created_at instanceof Date
                        ? existing.created_at.toLocaleDateString()
                        : new Date(existing.created_at).toLocaleDateString()
                    }
                  </p>
                )}
                {!existing && (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {provider.requiresSetup ? 'Requires setup' : 'Ready to use'}
                  </p>
                )}
              </div>
              {existing ? (
                <button
                  onClick={() => handleToggle(existing.id, existing.enabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                    existing.enabled ? 'bg-accent-green hover:bg-accent-green/90' : 'bg-bg-hover text-text-secondary border border-border-default hover:bg-bg-hover'
                  }`}
                >
                  {existing.enabled ? 'Enabled' : 'Disabled'}
                </button>
              ) : provider.requiresSetup ? (
                <button
                  onClick={() => setShowForm(showForm === provider.id ? null : provider.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/5 transition-colors"
                >
                  {showForm === provider.id ? 'Cancel' : 'Configure'}
                </button>
              ) : (
                <button
                  onClick={() => handleAddProvider(provider.id)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Adding...' : 'Enable'}
                </button>
              )}
            </div>

            {showForm === provider.id && provider.requiresSetup && !existing && (
              <div className="border-t border-border-default px-4 py-4 sm:px-5 space-y-3 bg-bg-tertiary">
                {CREDENTIAL_FIELDS[provider.id]?.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full border border-border-default rounded-lg px-3 py-2 text-sm bg-bg-secondary text-text-primary focus:border-border-active focus:outline-none"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAddProvider(provider.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-accent-blue text-white text-sm rounded-lg font-medium hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowForm(null)}
                    className="px-4 py-2 border border-border-default text-sm rounded-lg font-medium hover:bg-bg-hover text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
