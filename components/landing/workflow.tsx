'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const steps = [
  {
    number: '01',
    title: 'Create a Plan',
    description: 'Define your services, set pricing, and configure billing cycles for your offerings. Launch in minutes.',
    accent: '#6b7e93',
    accentBg: 'rgba(107, 126, 147, 0.08)',
    accentBorder: 'rgba(107, 126, 147, 0.2)',
  },
  {
    number: '02',
    title: 'Add Clients',
    description: 'Onboard clients in seconds. Assign plans, auto-generate invoices, and start tracking deliverables.',
    accent: '#8fa0b0',
    accentBg: 'rgba(143, 160, 176, 0.08)',
    accentBorder: 'rgba(143, 160, 176, 0.2)',
  },
  {
    number: '03',
    title: 'Get Paid',
    description: "Clients receive invoices with payment options. Track collections and manage your agency's cash flow.",
    accent: '#c4d0d8',
    accentBg: 'rgba(196, 208, 216, 0.08)',
    accentBorder: 'rgba(196, 208, 216, 0.2)',
  },
];

export function Workflow() {
  return (
    <section
      id="workflow"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(143,160,176,0.04), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'var(--landing-badge-bg)', border: '1px solid var(--landing-badge-border)', color: 'var(--text-secondary)' }}
          >
            How it works
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Three steps to autopilot
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            From setup to getting paid, we've streamlined the entire workflow.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(107,126,147,0.3), rgba(160,180,196,0.3), rgba(196,208,216,0.3))',
            }}
          />

          {steps.map((step, i) => (
            <ScrollReveal key={step.number} direction="up" delay={i * 0.15}>
              <div className="relative flex flex-col items-center text-center">
                {/* Step number circle */}
                <div
                  className="relative z-10 flex items-center justify-center w-[52px] h-[52px] rounded-2xl mb-7 font-black text-base"
                  style={{
                    background: step.accentBg,
                    border: `1px solid ${step.accentBorder}`,
                    color: step.accent,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: `0 0 30px ${step.accentBg}`,
                  }}
                >
                  {step.number}
                </div>

                {/* Content card */}
                <div
                  className="w-full rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: 'var(--landing-card-bg)',
                    border: '1px solid var(--landing-card-border)',
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {step.description}
                  </p>

                  {/* Accent underline */}
                  <div
                    className="mt-5 h-px w-12 mx-auto rounded-full"
                    style={{ background: step.accent, opacity: 0.4 }}
                  />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
