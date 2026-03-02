'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileSignature } from 'lucide-react';

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
      {/* Mobile: compact divided list */}
      <div className="sm:hidden bg-bg-secondary border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
        {contracts.map(contract => (
          <Link
            key={contract.id}
            href={`/dashboard/contracts/${contract.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-bg-tertiary border border-border-default flex-shrink-0">
                <FileSignature className="h-3.5 w-3.5 text-text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{contract.file_name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {new Date(contract.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${
              contract.signed ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-amber/10 text-accent-amber'
            }`}>
              {contract.signed ? 'Signed' : 'Pending'}
            </span>
          </Link>
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
                  <Link href={`/dashboard/contracts/${contract.id}`} className="text-accent-blue hover:underline text-sm">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
