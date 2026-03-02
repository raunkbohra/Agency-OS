'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileSignature, ArrowRight } from 'lucide-react';

interface Contract {
  id: string;
  client_id: string;
  file_name: string;
  signed: boolean;
  signed_at?: string;
  created_at: string;
}

export default function ContractsList({ agencyId }: { agencyId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      const res = await fetch(`/api/contracts?agencyId=${agencyId}`);
      const data = await res.json();
      setContracts(data);
      setLoading(false);
    };
    fetchContracts();
  }, [agencyId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-secondary border border-border-default animate-pulse" />
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-16 text-text-tertiary text-sm bg-bg-secondary rounded-xl border border-border-default">
        No contracts yet. Upload your first contract to get started.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-2">
        {contracts.map(contract => (
          <div
            key={contract.id}
            className="flex items-start justify-between gap-3 p-4 bg-bg-secondary rounded-xl border border-border-default"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-bg-tertiary border border-border-default flex-shrink-0 mt-0.5">
                <FileSignature className="h-4 w-4 text-text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{contract.file_name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {contract.signed_at && (
                  <p className="text-xs text-accent-green mt-0.5">
                    Signed {new Date(contract.signed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                contract.signed ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-amber/10 text-accent-amber'
              }`}>
                {contract.signed ? 'Signed' : 'Pending'}
              </span>
              <Link href={`/contracts/${contract.id}`}>
                <ArrowRight className="h-4 w-4 text-text-tertiary" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary border-b border-border-default">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">File</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Client</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Signed Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-bg-hover transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-text-primary">{contract.file_name}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{contract.client_id}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    contract.signed ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-amber/10 text-accent-amber'
                  }`}>
                    {contract.signed ? 'Signed' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/contracts/${contract.id}`} className="text-accent-blue hover:underline text-sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
