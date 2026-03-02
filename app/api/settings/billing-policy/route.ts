import { auth } from '@/lib/auth';
import { updateAgencyBillingPolicy } from '@/lib/db-queries';

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.agencyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { policy } = await req.json();
  if (policy !== 'next_month' && policy !== 'prorated') {
    return Response.json({ error: 'Invalid policy' }, { status: 400 });
  }

  const agency = await updateAgencyBillingPolicy(session.user.agencyId, policy);
  return Response.json({ billing_start_policy: agency.billing_start_policy });
}
