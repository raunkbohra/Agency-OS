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
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">File</th>
            <th className="px-6 py-3 text-left font-semibold">Client</th>
            <th className="px-6 py-3 text-left font-semibold">Status</th>
            <th className="px-6 py-3 text-left font-semibold">Signed Date</th>
            <th className="px-6 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(contract => (
            <tr key={contract.id} className="border-t">
              <td className="px-6 py-3">{contract.file_name}</td>
              <td className="px-6 py-3">{contract.client_id}</td>
              <td className="px-6 py-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  contract.signed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {contract.signed ? 'Signed' : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-3">
                {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-3">
                <Link href={`/contracts/${contract.id}`} className="text-blue-600 hover:underline">
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
