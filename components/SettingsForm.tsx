'use client';

import { useState } from 'react';
import { Agency } from '@/lib/db-queries';

interface SettingsFormProps {
  initialAgency: Agency;
}

export default function SettingsForm({ initialAgency }: SettingsFormProps) {
  const [agency, setAgency] = useState<Agency>(initialAgency);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);

  // Form state
  const [name, setName] = useState(initialAgency.name || '');
  const [email, setEmail] = useState(initialAgency.email || '');
  const [currency, setCurrency] = useState(initialAgency.currency || 'NPR');
  const [country, setCountry] = useState(initialAgency.country || '');
  const [address, setAddress] = useState(initialAgency.address || '');
  const [billingAddress, setBillingAddress] = useState(initialAgency.billing_address || '');
  const [bankName, setBankName] = useState(initialAgency.bank_name || '');
  const [bankAccount, setBankAccount] = useState(initialAgency.bank_account || '');
  const [bankRouting, setBankRouting] = useState(initialAgency.bank_routing || '');
  const [logoUrl, setLogoUrl] = useState(initialAgency.logo_url || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(initialAgency.logo_url || null);
  const [uploading, setUploading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cancel previous upload if still in progress
    if (uploadController) {
      uploadController.abort();
    }

    const newController = new AbortController();
    setUploadController(newController);

    // Client-side validation
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 500;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 2MB limit`);
      setUploadController(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported');
      setUploadController(null);
      return;
    }

    // Check image dimensions
    const img = new Image();
    const reader = new FileReader();

    reader.onload = async (e) => {
      img.onload = async () => {
        if (img.width > MAX_WIDTH) {
          setError(`Image width (${img.width}px) exceeds 2000px limit`);
          setUploadController(null);
          return;
        }

        if (img.height > MAX_HEIGHT) {
          setError(`Image height (${img.height}px) exceeds 500px limit`);
          setUploadController(null);
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
            signal: newController.signal,
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to upload logo');
          }

          const data = await res.json();
          setLogoUrl(data.fileUrl);
          setLogoPreview(data.fileUrl);
          setError(null);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return; // Upload was cancelled
          }
          setError(err instanceof Error ? err.message : 'Failed to upload logo');
        } finally {
          setUploading(false);
          setUploadController(null);
        }
      };

      img.onerror = () => {
        setError('Invalid image file');
        setUploadController(null);
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
          address: address.trim() || null,
          billing_address: billingAddress.trim() || null,
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

  return (
    <div className="space-y-6 max-w-5xl">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Section */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 lg:p-6">
          <h3 className="text-sm lg:text-base font-semibold text-text-primary mb-4">
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
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary font-medium">Logo uploaded</p>
                    <p className="text-xs text-text-secondary truncate font-mono text-[10px] break-all">
                      {logoPreview.split('/').pop() || 'image'}
                    </p>
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

        {/* Agency Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5 lg:p-6">
            <h3 className="text-sm lg:text-base font-semibold text-text-primary mb-4">
              Basic Information
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
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-5 lg:p-6">
            <h3 className="text-sm lg:text-base font-semibold text-text-primary mb-4">
              Address Information
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="address" className="text-sm font-medium text-text-primary">
                  Office Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your office address"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm resize-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Displayed on invoices
                </p>
              </div>

              <div>
                <label htmlFor="billingAddress" className="text-sm font-medium text-text-primary">
                  Billing Address
                </label>
                <textarea
                  id="billingAddress"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Leave blank to use office address"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-border-default rounded-lg text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 lg:p-6">
          <h3 className="text-sm lg:text-base font-semibold text-text-primary mb-2">
            Bank Details
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Leave empty if you don't want to display bank details on invoices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
