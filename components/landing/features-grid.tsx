'use client';

import { Package, FileText, FileSignature, Users, CreditCard, BarChart3 } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';
import { HoverCardGlow } from '@/components/motion/hover-card-glow';

const features = [
  { icon: Package, title: 'Plans & Pricing', description: 'Create service plans with custom deliverables, pricing tiers, and billing cycles. Assign plans to clients in one click.', className: 'md:col-span-2 md:row-span-2' },
  { icon: FileText, title: 'Invoices', description: 'Auto-generate invoices when clients sign up. Track payment status and send reminders.', className: '' },
  { icon: FileSignature, title: 'Contracts', description: 'Upload and manage contracts. Track signatures and expiration dates.', className: '' },
  { icon: Users, title: 'Clients', description: 'Manage your client roster with plans, invoices, and deliverables linked automatically.', className: '' },
  { icon: CreditCard, title: 'Deliverables', description: 'Track every deliverable across clients. Status workflows from draft to approved with client portal access.', className: 'md:col-span-2' },
  { icon: BarChart3, title: 'Metrics Dashboard', description: 'Real-time MRR, ARR, collection rates, and operational metrics. Know exactly how your agency is performing.', className: 'md:col-span-3' },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">Everything you need</h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">From plans to payments, manage every aspect of your agency in one place.</p>
        </div>
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <ScrollStaggerItem key={feature.title} className={feature.className}>
              <HoverCardGlow className="h-full rounded-xl border border-border-default bg-bg-secondary p-6 transition-all duration-200 hover:border-border-hover hover:-translate-y-px">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent-blue/10">
                    <feature.icon className="h-5 w-5 text-accent-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mt-1">{feature.title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </HoverCardGlow>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
