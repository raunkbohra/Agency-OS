'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const steps = [
  { number: '1', title: 'Create a Plan', description: 'Define your services, set pricing, and configure billing cycles for your offerings.' },
  { number: '2', title: 'Add Clients', description: 'Onboard clients in seconds. Assign plans, auto-generate invoices, and start tracking.' },
  { number: '3', title: 'Get Paid', description: 'Clients receive invoices with payment options. Track collections and manage cash flow.' },
];

export function Workflow() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">How it works</h2>
          <p className="mt-4 text-lg text-text-secondary">Three steps to running your agency on autopilot.</p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div className="hidden md:block absolute top-6 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-border-default via-accent-blue/30 to-border-default" />
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} direction="up" delay={i * 0.15}>
              <div className="relative text-center">
                <div className="relative z-10 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent-blue bg-bg-primary text-lg font-bold text-accent-blue">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary max-w-xs mx-auto">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
