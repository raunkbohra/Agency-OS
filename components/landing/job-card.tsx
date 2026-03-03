import { MapPin, Clock, ArrowRight } from 'lucide-react';

interface JobCardProps {
  title: string;
  department: string;
  location: string;
  type: string;
  applyUrl?: string;
}

export function JobCard({ title, department, location, type, applyUrl }: JobCardProps) {
  return (
    <div
      className="rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 group"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mb-2" style={{ color: 'var(--accent-blue)' }}>{department}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <MapPin size={12} />{location}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={12} />{type}
          </span>
        </div>
      </div>
      {applyUrl && (
        <a
          href={applyUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            background: 'var(--landing-badge-bg)',
            border: '1px solid var(--landing-badge-border)',
            color: 'var(--text-primary)',
          }}
        >
          Apply <ArrowRight size={14} />
        </a>
      )}
    </div>
  );
}
