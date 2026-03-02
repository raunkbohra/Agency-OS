import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import ContractsList from '@/components/ContractsList';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageTransition } from '@/components/motion/page-transition';


export default async function ContractsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">No agency found</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Contracts"
        description="Manage client contracts and signatures"
        actions={
          <Link href="/dashboard/contracts/upload" className="inline-flex items-center px-3 py-2 text-sm bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors">
            Upload Contract
          </Link>
        }
      />

      <ContractsList agencyId={agencyId} />
    </PageTransition>
  );
}
