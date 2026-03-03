import { PricingTable } from '@/components/landing/pricing-table';

export const metadata = {
  title: 'Pricing | Agency OS',
  description: 'Compare pricing plans for agencies of all sizes. Free, Basic, and Pro tiers with detailed feature comparison.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-5"
            style={{
              background: 'var(--landing-badge-bg)',
              border: '1px solid var(--landing-badge-border)',
              color: 'var(--text-secondary)',
            }}
          >
            Plans & Pricing
          </div>
          <h1
            className="text-4xl md:text-5xl font-black tracking-[-0.03em]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Compare every feature
          </h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Find the perfect plan for your agency. Start free, scale as you grow.
          </p>
        </div>

        <PricingTable />
      </div>
    </main>
  );
}
