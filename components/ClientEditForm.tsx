'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/db-queries';
import { Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ClientEditFormProps {
  client: Client;
  agencyId: string;
}

export default function ClientEditForm({ client, agencyId }: ClientEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: client.name || '',
    email: client.email || '',
    company_name: client.company_name || '',
    phone: client.phone || '',
    address: client.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update client');
      }

      setSuccess(true);
      toast({ title: 'Client updated!' });
      const t = setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
      return () => clearTimeout(t);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-primary bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
      >
        <Edit2 className="h-4 w-4" />
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-primary border border-border-default rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-bg-primary">
              <h2 className="text-lg font-semibold text-text-primary">Edit Client</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  Client updated successfully!
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
                  Client Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                />
              </div>

              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-text-primary mb-1.5">
                  Company Name
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1.5">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-1.5">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter client address (one line per field)"
                  className="w-full px-3 py-2 border border-border-default rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Use line breaks to separate address lines (e.g., street, city, postal code)
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-border-default mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-text-primary bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  success={success}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
