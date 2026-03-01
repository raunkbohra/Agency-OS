'use client';

import { Package, FileText, FileSignature, Users, CheckSquare, BarChart3 } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';

const features = [
  {
    icon: Package,
    title: 'Plans & Pricing',
    description: 'Create service plans with custom deliverables, pricing tiers, and billing cycles. Assign plans to clients in one click.',
    accent: '#0070f3',
    accentBg: 'rgba(0, 112, 243, 0.08)',
    accentBorder: 'rgba(0, 112, 243, 0.2)',
    className: 'md:col-span-2 md:row-span-2',
    large: true,
  },
  {
    icon: FileText,
    title: 'Smart Invoicing',
    description: 'Auto-generate invoices when clients sign up. Track payment status and send reminders automatically.',
    accent: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.08)',
    accentBorder: 'rgba(124, 58, 237, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: FileSignature,
    title: 'Contracts',
    description: 'Upload and manage contracts. Track signatures and expiration dates.',
    accent: '#00c853',
    accentBg: 'rgba(0, 200, 83, 0.08)',
    accentBorder: 'rgba(0, 200, 83, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage your client roster with plans, invoices, and deliverables linked automatically.',
    accent: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.08)',
    accentBorder: 'rgba(245, 158, 11, 0.2)',
    className: '',
    large: false,
  },
  {
    icon: CheckSquare,
    title: 'Deliverables Tracking',
    description: 'Track every deliverable across clients. Status workflows from draft to approved with client portal access.',
    accent: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.08)',
    accentBorder: 'rgba(236, 72, 153, 0.2)',
    className: 'md:col-span-2',
    large: false,
  },
  {
    icon: BarChart3,
    title: 'Metrics Dashboard',
    description: 'Real-time MRR, ARR, collection rates, and operational metrics. Know exactly how your agency is performing at a glance.',
    accent: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.08)',
    accentBorder: 'rgba(6, 182, 212, 0.2)',
    className: 'md:col-span-3',
    large: false,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-28 px-6" style={{ background: '#060609' }}>
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
          >
            Capabilities
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Everything you need
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: '#6b7280' }}>
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
                  background: 'rgba(12, 12, 20, 0.8)',
                  border: `1px solid rgba(255,255,255,0.07)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: feature.large ? '260px' : '180px',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = `1px solid ${feature.accentBorder}`;
                  el.style.background = `rgba(12, 12, 20, 0.95)`;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = `0 20px 60px -10px rgba(0,0,0,0.6), 0 0 40px -10px ${feature.accentBg}`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.border = '1px solid rgba(255,255,255,0.07)';
                  el.style.background = 'rgba(12, 12, 20, 0.8)';
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
                  className="text-base font-bold text-white mb-2.5"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
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
