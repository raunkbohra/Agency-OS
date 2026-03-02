'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import { Agency } from '@/lib/db-queries';

export default function SettingsPage() {
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [country, setCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankRouting, setBankRouting] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchAgency() {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (!session?.user?.agencyId) {
          router.push('/auth/signin');
          return;
        }

        const agencyRes = await fetch(`/api/agency?id=${session.user.agencyId}`);
        if (!agencyRes.ok) throw new Error('Failed to fetch agency');

        const agencyData = await agencyRes.json();
        setAgency(agencyData);
        setName(agencyData.name || '');
        setEmail(agencyData.email || '');
        setCurrency(agencyData.currency || 'NPR');
        setCountry(agencyData.country || '');
        setBankName(agencyData.bank_name || '');
        setBankAccount(agencyData.bank_account || '');
        setBankRouting(agencyData.bank_routing || '');
        setLogoUrl(agencyData.logo_url || '');
        setLogoPreview(agencyData.logo_url || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agency');
      } finally {
        setLoading(false);
      }
    }

    fetchAgency();
  }, [router]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 500;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 2MB limit`);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported');
      return;
    }

    // Check image dimensions
    const img = new Image();
    const reader = new FileReader();

    reader.onload = async (e) => {
      img.onload = async () => {
        if (img.width > MAX_WIDTH) {
          setError(`Image width (${img.width}px) exceeds 2000px limit`);
          return;
        }

        if (img.height > MAX_HEIGHT) {
          setError(`Image height (${img.height}px) exceeds 500px limit`);
          return;
        }

        // Dimensions are valid, proceed with upload
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('directory', 'logos');

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to upload logo');
          }

          const data = await res.json();
          setLogoUrl(data.fileUrl);
          setLogoPreview(data.fileUrl);
          setError(null);

          // Show compression info if applicable
          if (data.compressed) {
            console.log(
              `✓ Logo compressed: ${(data.originalSize / 1024).toFixed(1)}KB → ${(data.uploadedSize / 1024).toFixed(1)}KB`
            );
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload logo');
        } finally {
          setUploading(false);
        }
      };

      img.onerror = () => {
        setError('Invalid image file');
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoUrl('');
    setLogoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/agency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          currency,
          country: country.trim() || null,
          bank_name: bankName.trim() || null,
          bank_account: bankAccount.trim() || null,
          bank_routing: bankRouting.trim() || null,
          logo_url: logoUrl || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update agency');

      const updated = await res.json();
      setAgency(updated);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <PageHeader title="Settings" description="Configure your agency preferences" />
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Configure your agency preferences" />

      <div className="space-y-5 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Agency Logo Section */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Agency Logo
            </h3>

            <div className="space-y-3">
              {logoPreview && (
                <div className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-default">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Agency Logo"
                        className="h-12 w-12 object-contain"
                        onLoad={() => {
                          console.log('✓ Logo loaded:', logoPreview);
                        }}
                        onError={() => {
                          console.warn('⚠ Logo failed to load from:', logoPreview);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary font-medium">Logo uploaded</p>
                      <p className="text-xs text-text-secondary truncate font-mono text-[10px] break-all">{logoPreview.split('/').pop() || 'image'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap ml-2 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              )}

              {uploading && (
                <div className="p-3 bg-bg-primary rounded-lg border border-border-default">
                  <p className="text-sm text-text-secondary">Uploading logo...</p>
                </div>
              )}

              <div>
                <label htmlFor="logo" className="text-sm font-medium text-text-primary">
                  Upload Logo
                </label>
                <input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm disabled:opacity-50"
                />
                <p className="text-xs text-text-secondary mt-1">
                  JPG, PNG, or WebP (max 2MB, max 2000x500px). Images are auto-compressed to WebP.
                </p>
              </div>
            </div>
          </div>

          {/* Agency Profile Section */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Agency Profile
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-text-primary">
                  Agency Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-text-primary">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="currency" className="text-sm font-medium text-text-primary">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                  >
                    <option value="NPR">NPR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="country" className="text-sm font-medium text-text-primary">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., Nepal"
                    className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">
              Bank Details
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Leave empty if you don't want to display bank details on invoices.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="bankName" className="text-sm font-medium text-text-primary">
                  Bank Name
                </label>
                <input
                  id="bankName"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                />
              </div>

              <div>
                <label htmlFor="bankAccount" className="text-sm font-medium text-text-primary">
                  Account Number
                </label>
                <input
                  id="bankAccount"
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                />
              </div>

              <div>
                <label htmlFor="bankRouting" className="text-sm font-medium text-text-primary">
                  Routing Number
                </label>
                <input
                  id="bankRouting"
                  type="text"
                  value={bankRouting}
                  onChange={(e) => setBankRouting(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
