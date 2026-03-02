'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Building2, MapPin, CheckCircle } from 'lucide-react';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  address: string | null;
}

export default function ClientPortalProfile() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    address: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/client-portal/me/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data.client);
        setFormData({
          name: data.client.name || '',
          phone: data.client.phone || '',
          companyName: data.client.companyName || '',
          address: data.client.address || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear success message when user starts editing
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/client-portal/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || undefined,
          phone: formData.phone || undefined,
          companyName: formData.companyName || undefined,
          address: formData.address || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        setIsSaving(false);
        return;
      }

      setSuccessMessage('Profile updated successfully!');
      setProfile(data.client);
      setIsSaving(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating profile');
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" viewBox="0 0 24 24" style={{ color: 'var(--accent-blue)' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div
        className="p-4 rounded-lg border text-sm"
        style={{
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          color: 'var(--accent-red)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--app-sidebar-icon-bg)' }}
        >
          <User size={32} style={{ color: 'white' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {profile?.name || 'Client'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{profile?.email}</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{
            background: 'rgba(0, 200, 83, 0.1)',
            border: '1px solid rgba(0, 200, 83, 0.3)',
            color: 'var(--accent-green)',
          }}
        >
          <CheckCircle size={20} />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            color: 'var(--accent-red)',
          }}
        >
          <div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User size={16} />
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 98, 120, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Email Field (Read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Mail size={16} />
            Email Address
          </label>
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-tertiary)',
              cursor: 'not-allowed',
            }}
          />
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Phone size={16} />
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Your phone number"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 98, 120, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Company Name Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 size={16} />
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Your company name"
            className="w-full px-4 py-3 rounded-lg text-sm transition-all"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 98, 120, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Address Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MapPin size={16} />
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Your address"
            rows={3}
            className="w-full px-4 py-3 rounded-lg text-sm transition-all resize-none"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 98, 120, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50"
          style={{
            background: 'var(--accent-blue)',
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}
