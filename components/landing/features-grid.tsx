'use client';

import { Package, FileText, FileSignature, Users, CheckSquare, BarChart3 } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';

const features = [
  {
    icon: Package,
    title: 'Plans & Pricing',
    description: 'Create service plans with custom deliverables, pricing tiers, and billing cycles. Assign plans to clients in one click.',
    accent: '#6b7e93',
    accentBg: 'rgba(107, 126, 147, 0.08)',
    accentBorder: 'rgba(107, 126, 147, 0.2)',
    className: 'md:col-span-2 md:row-span-2',
    large: true,
  },
  {
    icon: FileText,
    title: 'Smart Invoicing',
    description: 'Auto-generate invoices when clients sign up. Track payment status and send reminders automatically.',
    accent: '#8fa0b0',
    accentBg: 'rgba(143, 160, 176, 0.08)',
    accentBorder: 'rgba(143, 160, 176, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: FileSignature,
    title: 'Contracts',
    description: 'Upload and manage contracts. Track signatures and expiration dates.',
    accent: '#a0b4c4',
    accentBg: 'rgba(160, 180, 196, 0.08)',
    accentBorder: 'rgba(160, 180, 196, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage your client roster with plans, invoices, and deliverables linked automatically.',
    accent: '#b0c0cc',
    accentBg: 'rgba(176, 192, 204, 0.08)',
    accentBorder: 'rgba(176, 192, 204, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: CheckSquare,
    title: 'Deliverables Tracking',
    description: 'Track every deliverable across clients. Status workflows from draft to approved with client portal access.',
    accent: '#7a8fa0',
    accentBg: 'rgba(122, 143, 160, 0.08)',
    accentBorder: 'rgba(122, 143, 160, 0.2)',
    className: 'md:col-span-2',
    large: false,
  },
  {
    icon: BarChart3,
    title: 'Metrics Dashboard',
    description: 'Real-time MRR, ARR, collection rates, and operational metrics. Know exactly how your agency is performing at a glance.',
    accent: '#c4d0d8',
    accentBg: 'rgba(196, 208, 216, 0.08)',
    accentBorder: 'rgba(196, 208, 216, 0.2)',
    className: 'md:col-span-3',
    large: false,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-28 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'var(--landing-badge-bg)', border: '1px solid var(--landing-badge-border)', color: 'var(--text-secondary)' }}
          >
            Capabilities
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Everything you need
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            From plans to payments, manage every aspect of your agency in one unified platform.
          </p>
        </div>

        {/* Bento grid */}
        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 auto-rows-auto gap-3">
          {features.map((feature) => (
            <ScrollStaggerItem key={feature.title} className={feature.className}>
              <div
                className="group relative h-full rounded-2xl p-6 transition-all duration-300 cursor-default"
                style={{
                  background: 'var(--landing-card-bg)',
                  border: `1px solid var(--landing-card-border)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: feature.large ? '260px' : '180px',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = `1px solid ${feature.accentBorder}`;
                  el.style.background = `var(--landing-card-bg)`;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = `0 20px 60px -10px rgba(0,0,0,0.6), 0 0 40px -10px ${feature.accentBg}`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = '1px solid var(--landing-card-border)';
                  el.style.background = 'var(--landing-card-bg)';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Icon */}
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                  style={{ background: feature.accentBg, border: `1px solid ${feature.accentBorder}` }}
                >
                  <feature.icon size={18} style={{ color: feature.accent }} />
                </div>

                <h3
                  className="text-base font-bold mb-2.5"
                  style={{ letterSpacing: '-0.01em', color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>

                {/* Subtle corner accent for large card */}
                {feature.large && (
                  <div
                    className="absolute bottom-0 right-0 w-40 h-40 rounded-2xl pointer-events-none opacity-30"
                    style={{
                      background: `radial-gradient(circle at bottom right, ${feature.accentBg}, transparent)`,
                    }}
                  />
                )}
              </div>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
