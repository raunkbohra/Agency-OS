import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAgencyInvite, getAgencyById } from '@/lib/db-queries';
import { sendTeamInviteEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Auth check
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agency ID from session
    const agencyId = session.user.agencyId;

    // Check if user is owner of agency
    const agency = await getAgencyById(agencyId);
    if (!agency || agency.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only agency owner can invite members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, roles } = body;

    // Validation
    if (!email || typeof email !== 'string' || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or roles' },
        { status: 400 }
      );
    }

    // Generate invite token
    const token = randomBytes(32).toString('hex');

    // Create invite
    const invite = await createAgencyInvite(agencyId, email, roles, token);

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/join-team/${token}`;

    await sendTeamInviteEmail({
      to: email,
      memberName: email.split('@')[0],
      agencyName: agency.name,
      roles,
      inviteUrl,
    });

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      message: `Invite sent to ${email}`,
    });
  } catch (error) {
    console.error('Error creating team invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
