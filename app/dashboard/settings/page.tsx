import { auth } from '@/lib/auth';
import { getAgencyById } from '@/lib/db-queries';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.agencyId) {
    redirect('/auth/signin');
  }

  const agency = await getAgencyById(session.user.agencyId);

  if (!agency) {
    return (
      <PageTransition>
        <PageHeader title="Settings" description="Configure your agency preferences" />
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">Agency not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Configure your agency preferences" />
      <SettingsForm initialAgency={agency} />
    </PageTransition>
  );
}
