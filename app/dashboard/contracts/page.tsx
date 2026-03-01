import { auth } from '@/lib/auth';
import { getAgenciesByOwnerId } from '@/lib/db-queries';
import ContractsList from '@/components/ContractsList';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ContractsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const agencies = await getAgenciesByOwnerId(session.user.id);
  const agencyId = agencies[0]?.id;

  if (!agencyId) {
    return <div className="p-8">No agency found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-gray-600 mt-1">Manage client contracts and signatures</p>
        </div>
        <Link
          href="/dashboard/contracts/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
        >
          Upload Contract
        </Link>
      </div>

      <ContractsList agencyId={agencyId} />
    </div>
  );
}
