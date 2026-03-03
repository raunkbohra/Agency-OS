import { Pricing } from '@/components/landing/pricing';

export const metadata = {
  title: 'Pricing | Agency OS',
  description: 'Affordable pricing plans for agencies of all sizes. Choose the plan that fits your needs.',
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
      <Pricing />
    </main>
  );
}
