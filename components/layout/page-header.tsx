import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-3 mb-5 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary leading-snug" style={{ textWrap: 'balance' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-tertiary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
