'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const steps = [
  {
    number: '01',
    title: 'Create a Plan',
    description: 'Define your services, set pricing, and configure billing cycles for your offerings. Launch in minutes.',
    accent: '#0070f3',
    accentBg: 'rgba(0, 112, 243, 0.08)',
    accentBorder: 'rgba(0, 112, 243, 0.2)',
  },
  {
    number: '02',
    title: 'Add Clients',
    description: 'Onboard clients in seconds. Assign plans, auto-generate invoices, and start tracking deliverables.',
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.08)',
    accentBorder: 'rgba(124, 58, 237, 0.2)',
  },
  {
    number: '03',
    title: 'Get Paid',
    description: "Clients receive invoices with payment options. Track collections and manage your agency's cash flow.",
    accent: '#00c853',
    accentBg: 'rgba(0, 200, 83, 0.08)',
    accentBorder: 'rgba(0, 200, 83, 0.2)',
  },
];

export function Workflow() {
  return (
    <section
      id="workflow"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060609 0%, #0a0a14 50%, #060609 100%)' }}
    >
      {/* Background accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.04), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
          >
            How it works
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Three steps to autopilot
          </h2>
          <p className="mt-4 text-lg" style={{ color: '#6b7280' }}>
            From setup to getting paid, we've streamlined the entire workflow.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0,112,243,0.3), rgba(124,58,237,0.3), rgba(0,200,83,0.3))',
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
                    background: 'rgba(12, 12, 20, 0.7)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <h3
                    className="text-lg font-bold text-white mb-3"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
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
