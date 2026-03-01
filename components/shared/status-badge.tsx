import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { variant: any; label: string; pulse?: boolean }> = {
  // Invoice statuses
  draft: { variant: 'default', label: 'Draft' },
  pending: { variant: 'warning', label: 'Pending', pulse: true },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'danger', label: 'Overdue', pulse: true },
  cancelled: { variant: 'default', label: 'Cancelled' },
  escalated: { variant: 'purple', label: 'Escalated', pulse: true },
  // Deliverable statuses
  in_review: { variant: 'info', label: 'In Review', pulse: true },
  approved: { variant: 'success', label: 'Approved' },
  changes_requested: { variant: 'warning', label: 'Changes Requested' },
  done: { variant: 'success', label: 'Done' },
  // Contract statuses
  signed: { variant: 'success', label: 'Signed' },
  unsigned: { variant: 'warning', label: 'Awaiting Signature', pulse: true },
  // Scope alert statuses
  active: { variant: 'danger', label: 'Active', pulse: true },
  acknowledged: { variant: 'warning', label: 'Acknowledged' },
  resolved: { variant: 'success', label: 'Resolved' },
  critical: { variant: 'danger', label: 'Critical', pulse: true },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} pulse={config.pulse} className={className}>
      {config.label}
    </Badge>
  );
}
