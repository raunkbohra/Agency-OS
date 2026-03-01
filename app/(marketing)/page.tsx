import { Hero } from '@/components/landing/hero';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { Workflow } from '@/components/landing/workflow';
import { MetricsShowcase } from '@/components/landing/metrics-showcase';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <Workflow />
      <MetricsShowcase />
    </main>
  );
}
