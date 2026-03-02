import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAgencyById, updateUserRoles, removeUserFromAgency } from '@/lib/db-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = session.user.agencyId;

    // Check if user is owner
    const agency = await getAgencyById(agencyId);
    if (!agency || agency.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only agency owner can update member roles' }, { status: 403 });
    }

    const body = await request.json();
    const { roles } = body;

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'Invalid roles' },
        { status: 400 }
      );
    }

    const { userId } = await params;

    // Update roles
    await updateUserRoles(userId, agencyId, roles);

    return NextResponse.json({
      success: true,
      userId,
      roles,
    });
  } catch (error) {
    console.error('Error updating team member roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = session.user.agencyId;

    // Check if user is owner
    const agency = await getAgencyById(agencyId);
    if (!agency || agency.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only agency owner can remove members' }, { status: 403 });
    }

    const { userId } = await params;

    // Prevent removing self
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 });
    }

    // Remove user from agency
    await removeUserFromAgency(userId, agencyId);

    return NextResponse.json({
      success: true,
      message: 'Member removed',
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
