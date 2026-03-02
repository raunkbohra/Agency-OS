'use client';

import { Deliverable } from '@/lib/db-queries';

interface DeliverableStatsProps {
  deliverables: Deliverable[];
}

export default function DeliverableStats({ deliverables }: DeliverableStatsProps) {
  // Calculate statistics
  const pending = deliverables.filter(d =>
    d.status === 'draft' || d.status === 'changes_requested'
  ).length;

  const inReview = deliverables.filter(d => d.status === 'in_review').length;

  const done = deliverables.filter(d => d.status === 'done' || d.status === 'approved').length;

  const total = deliverables.length;
  const completionPercent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
      {/* Pending */}
      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Pending</p>
        <p className="text-2xl font-bold text-accent-blue mt-2">{pending}</p>
      </div>

      {/* In Review */}
      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">In Review</p>
        <p className="text-2xl font-bold text-accent-amber mt-2">{inReview}</p>
      </div>

      {/* Done */}
      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Done</p>
        <p className="text-2xl font-bold text-accent-green mt-2">{done}</p>
      </div>

      {/* Completion */}
      <div className="bg-bg-secondary rounded-xl p-4 border border-border-default">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Completion</p>
        <p className="text-2xl font-bold text-text-primary mt-2">{completionPercent}%</p>
      </div>
    </div>
  );
}
