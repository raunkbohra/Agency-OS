import { auth } from '@/lib/auth';
import { getPlanById, getPlanItemsByPlan } from '@/lib/db-queries';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { PageTransition } from '@/components/motion/page-transition';
import { PageHeader } from '@/components/layout/page-header';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { ChevronLeft } from 'lucide-react';
import PlanEditor from '@/components/PlanEditor';

interface PlanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const { id } = await params;
  let plan: any = null;
  let planItems: any[] = [];
  let error = null;

  try {
    plan = await getPlanById(id, session.user.agencyId!);
    if (!plan) notFound();
    planItems = await getPlanItemsByPlan(id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load plan';
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Plans
        </Link>
        <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red px-4 py-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  if (!plan) notFound();

  return (
    <PageTransition>
      <PageHeader
        title={plan.name}
        description="Plan details"
        actions={
          <Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:text-accent-blue/80 font-medium">
            <ChevronLeft className="h-4 w-4" /> Plans
          </Link>
        }
      />

      <ScrollReveal>
        <PlanEditor plan={plan} planItems={planItems} />
      </ScrollReveal>
    </PageTransition>
  );
}
