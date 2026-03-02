'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ClientPlan {
  client_plan_id: string;
  plan_id: string;
  status: string;
  plan_name: string;
}

export default function ContractUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientPlanId, setClientPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search states
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [showPlanList, setShowPlanList] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch plans when client is selected
  useEffect(() => {
    if (clientId) {
      fetchClientPlans(clientId);
    } else {
      setClientPlans([]);
      setClientPlanId('');
    }
  }, [clientId]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchClientPlans = async (cId: string) => {
    setLoadingPlans(true);
    try {
      const res = await fetch(`/api/clients/${cId}/plans`);
      if (res.ok) {
        const data = await res.json();
        setClientPlans(data);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredPlans = clientPlans.filter((p) =>
    p.client_plan_id.toLowerCase().includes(planSearch.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedPlan = clientPlans.find((p) => p.client_plan_id === clientPlanId);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!file || !clientId || !clientPlanId) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('clientPlanId', clientPlanId);

      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        router.push('/dashboard/contracts');
      } else {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Link
        href="/dashboard/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Contracts
      </Link>

      <div className="max-w-xl mx-auto">
        <PageHeader
          title="Upload Contract"
          description="Upload a contract PDF for a client"
        />

        <form
          onSubmit={handleUpload}
          className="bg-bg-secondary rounded-xl p-5 border border-border-default space-y-4"
        >
          {error && (
            <div className="p-3 bg-accent-red/10 border border-accent-red/20 text-accent-red rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Contract PDF *
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Client Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Client *
            </label>
            <button
              type="button"
              onClick={() => setShowClientList(!showClientList)}
              className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors text-left"
            >
              {selectedClient
                ? `${selectedClient.name} (${selectedClient.email})`
                : 'Select a client...'}
            </button>
            {showClientList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-lg z-50">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-3 py-2 border-b border-border-default bg-bg-tertiary text-text-primary text-sm focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {loadingClients ? (
                    <div className="p-3 text-sm text-text-tertiary">
                      Loading clients...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-text-tertiary">
                      No clients found
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setClientId(client.id);
                          setClientSearch('');
                          setShowClientList(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary transition-colors border-b border-border-default last:border-0"
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-text-tertiary">
                          {client.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Plan Selector */}
          {clientId && (
            <div className="relative">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Client Plan *
              </label>
              <button
                type="button"
                onClick={() => setShowPlanList(!showPlanList)}
                className="w-full border border-border-default bg-bg-tertiary text-text-primary rounded-lg px-3 py-2.5 text-sm focus:border-border-active focus:ring-1 focus:ring-accent-blue/30 transition-colors text-left"
              >
                {selectedPlan ? `Plan (${selectedPlan.client_plan_id})` : 'Select a plan...'}
              </button>
              {showPlanList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-lg z-50">
                  <input
                    type="text"
                    placeholder="Search plans..."
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    className="w-full px-3 py-2 border-b border-border-default bg-bg-tertiary text-text-primary text-sm focus:outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {loadingPlans ? (
                      <div className="p-3 text-sm text-text-tertiary">
                        Loading plans...
                      </div>
                    ) : filteredPlans.length === 0 ? (
                      <div className="p-3 text-sm text-text-tertiary">
                        No plans found
                      </div>
                    ) : (
                      filteredPlans.map((plan) => (
                        <button
                          key={plan.client_plan_id}
                          type="button"
                          onClick={() => {
                            setClientPlanId(plan.client_plan_id);
                            setPlanSearch('');
                            setShowPlanList(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-secondary transition-colors border-b border-border-default last:border-0"
                        >
                          <div className="font-medium">Plan: {plan.plan_name}</div>
                          <div className="text-xs text-text-tertiary">
                            Status: {plan.status}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file || !clientId || !clientPlanId}
            className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-accent-blue/90 transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Contract'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
