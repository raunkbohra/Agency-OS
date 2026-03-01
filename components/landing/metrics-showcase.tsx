'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const metrics = [
  { value: '100%', label: 'Automated' },
  { value: '5 min', label: 'Setup Time' },
  { value: '\u221E', label: 'Clients' },
  { value: '$0', label: 'To Start' },
];

export function MetricsShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="relative rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-xl p-12 md:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-aurora pointer-events-none" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">{metric.value}</div>
                  <div className="mt-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
