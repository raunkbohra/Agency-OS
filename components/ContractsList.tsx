'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-bg-secondary rounded-lg overflow-hidden border border-border-default">
      <table className="w-full">
        <thead className="bg-bg-tertiary">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-text-secondary">File</th>
            <th className="px-6 py-3 text-left font-semibold text-text-secondary">Client</th>
            <th className="px-6 py-3 text-left font-semibold text-text-secondary">Status</th>
            <th className="px-6 py-3 text-left font-semibold text-text-secondary">Signed Date</th>
            <th className="px-6 py-3 text-left font-semibold text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(contract => (
            <tr key={contract.id} className="border-t border-border-default">
              <td className="px-6 py-3 text-text-primary">{contract.file_name}</td>
              <td className="px-6 py-3 text-text-secondary">{contract.client_id}</td>
              <td className="px-6 py-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  contract.signed ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-amber/10 text-accent-amber'
                }`}>
                  {contract.signed ? 'Signed' : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-3 text-text-secondary">
                {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-3">
                <Link href={`/contracts/${contract.id}`} className="text-accent-blue hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
