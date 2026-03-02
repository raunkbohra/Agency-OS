import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAgencyTeamMembers } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = session.user.agencyId;

    const members = await getAgencyTeamMembers(agencyId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
