import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.agencyId) redirect('/auth/signin');

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Configure your agency preferences" />

      <div className="space-y-5 max-w-2xl">
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <p className="text-sm text-text-secondary">
            Agency settings will appear here.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
