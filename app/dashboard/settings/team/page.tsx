import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import TeamManagement from '@/components/TeamManagement';

export default async function TeamPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  return (
    <PageTransition>
      <PageHeader
        title="Team Management"
        description="Invite team members and manage their roles"
      />
      <TeamManagement />
    </PageTransition>
  );
}
