interface PageHeroProps {
  badge?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
}

export function PageHero({ badge, title, subtitle, lastUpdated }: PageHeroProps) {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {badge && (
          <span
            className="inline-block text-xs font-medium tracking-wider uppercase px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'var(--landing-badge-bg)',
              border: '1px solid var(--landing-badge-border)',
              color: 'var(--text-secondary)',
            }}
          >
            {badge}
          </span>
        )}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="text-sm mt-4" style={{ color: 'var(--text-quaternary)' }}>
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
    </section>
  );
}
