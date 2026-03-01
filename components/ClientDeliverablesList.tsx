'use client';

import { Deliverable } from '@/lib/db-queries';
import Link from 'next/link';

interface ClientDeliverablesListProps {
  deliverables: Deliverable[];
  clientToken: string;
}

export default function ClientDeliverablesList({ deliverables, clientToken }: ClientDeliverablesListProps) {
  return (
    <div className="grid gap-4">
      {deliverables.map(d => (
        <div key={d.id} className="bg-white rounded-lg p-6 border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{d.title}</h3>
              <p className="text-gray-600">{d.month_year}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              d.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              d.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
              d.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {d.status.replace('_', ' ')}
            </span>
          </div>

          {d.description && <p className="text-gray-700 mb-4">{d.description}</p>}

          <Link href={`/portal/${clientToken}/deliverables/${d.id}`} className="text-blue-600 hover:underline">
            View Details & Approve →
          </Link>
        </div>
      ))}
    </div>
  );
}
