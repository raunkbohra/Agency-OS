import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-xl bg-bg-tertiary p-4 mb-4">
        <Icon className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="text-md font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Button variant="primary" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
