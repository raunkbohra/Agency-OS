'use client';

import { useMemo } from 'react';

interface DeliverableStatsBarProps {
  deliverables: { status: string }[];
}

export function DeliverableStatsBar({ deliverables }: DeliverableStatsBarProps) {
  const stats = useMemo(() => {
    const pending = deliverables.filter(d =>
      d.status === 'draft' || d.status === 'changes_requested'
    ).length;
    const inReview = deliverables.filter(d => d.status === 'in_review').length;
    const done = deliverables.filter(d => d.status === 'done' || d.status === 'approved').length;
    const total = deliverables.length;
    const completionPercent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { pending, inReview, done, completionPercent, total };
  }, [deliverables]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-blue" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.pending}</span> Pending
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-amber" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.inReview}</span> In Review
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent-green" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.done}</span> Done
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-text-tertiary" />
        <span className="text-xs font-medium text-text-secondary">
          <span className="font-semibold text-text-primary">{stats.completionPercent}%</span> Complete
        </span>
      </div>
    </div>
  );
}
