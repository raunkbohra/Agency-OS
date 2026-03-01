'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { TrendingUp, Zap, Users, DollarSign } from 'lucide-react';

const metrics = [
  {
    value: '100%',
    label: 'Automated',
    description: 'Every invoice, reminder, and follow-up handled automatically.',
    icon: Zap,
    accent: '#6b7e93',
  },
  {
    value: '5 min',
    label: 'Setup Time',
    description: "Get your agency on Agency OS in under five minutes. No onboarding calls.",
    icon: TrendingUp,
    accent: '#8fa0b0',
  },
  {
    value: '∞',
    label: 'Clients',
    description: 'No limits on clients, plans, or deliverables on the Pro plan.',
    icon: Users,
    accent: '#a0b4c4',
  },
  {
    value: '$0',
    label: 'To Start',
    description: 'Start free with up to 3 clients. Upgrade only when you need to.',
    icon: DollarSign,
    accent: '#c4d0d8',
  },
];

export function MetricsShowcase() {
  return (
    <section className="py-28 px-6" style={{ background: '#060609' }}>
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 18, 0.95)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Background glows */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '50%',
                left: '20%',
                transform: 'translateY(-50%)',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(107,126,147,0.06), transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: '50%',
                right: '20%',
                transform: 'translateY(-50%)',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(143,160,176,0.06), transparent 70%)',
                filter: 'blur(60px)',
              }}
            />

            <div className="relative z-10 p-10 md:p-16">
              {/* Header */}
              <div className="text-center mb-14">
                <p
                  className="text-sm font-semibold uppercase tracking-widest mb-3"
                  style={{ color: '#6b7280' }}
                >
                  By the numbers
                </p>
                <h2
                  className="text-3xl md:text-4xl font-black tracking-[-0.03em] text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Built to move fast
                </h2>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {metrics.map((metric, i) => (
                  <div key={metric.label} className="text-center group">
                    {/* Icon */}
                    <div
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                      style={{
                        background: 'rgba(160, 175, 190, 0.08)',
                        border: '1px solid rgba(160, 175, 190, 0.18)',
                      }}
                    >
                      <metric.icon size={16} style={{ color: metric.accent }} />
                    </div>

                    {/* Value */}
                    <div
                      className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-2"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        background: `linear-gradient(135deg, ${metric.accent}, ${metric.accent}99)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {metric.value}
                    </div>

                    {/* Label */}
                    <div className="text-sm font-semibold text-white mb-2">{metric.label}</div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed" style={{ color: '#555565' }}>
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
