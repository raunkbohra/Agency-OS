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
        <div key={d.id} className="bg-bg-secondary rounded-lg p-6 border border-border-default">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{d.title}</h3>
              <p className="text-text-secondary">{d.month_year}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              d.status === 'draft' ? 'bg-bg-hover text-text-primary' :
              d.status === 'in_review' ? 'bg-accent-blue/10 text-accent-blue' :
              d.status === 'approved' ? 'bg-accent-green/10 text-accent-green' :
              'bg-accent-amber/10 text-accent-amber'
            }`}>
              {d.status.replace('_', ' ')}
            </span>
          </div>

          {d.description && <p className="text-text-secondary mb-4">{d.description}</p>}

          <Link href={`/portal/${clientToken}/deliverables/${d.id}`} className="text-accent-blue hover:underline">
            View Details & Approve →
          </Link>
        </div>
      ))}
    </div>
  );
}
