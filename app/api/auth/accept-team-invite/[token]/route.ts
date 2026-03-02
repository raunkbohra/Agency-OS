import { NextRequest, NextResponse } from 'next/server';
import {
  getAgencyInviteByToken,
  acceptAgencyInvite,
  getUserById,
  createUser,
  assignUserRole,
  setUserPassword,
} from '@/lib/db-queries';
import { hashPassword } from '@/lib/password';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Invite token required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, password, userId } = body;

    // Get invite by token
    const invite = await getAgencyInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or already accepted' }, { status: 404 });
    }

    let user;

    if (userId) {
      // Existing user joining agency
      user = await getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      // New user creating account
      if (!name || !password) {
        return NextResponse.json(
          { error: 'Name and password required for new accounts' },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      user = await createUser(invite.agency_id, invite.email, name, 'member');

      // Set password
      await setUserPassword(user.id, passwordHash);
    }

    // Assign roles
    for (const role of invite.roles) {
      await assignUserRole(user.id, invite.agency_id, role);
    }

    // Mark invite as accepted
    await acceptAgencyInvite(token, user.id);

    // Return success with redirect info
    return NextResponse.json({
      success: true,
      agencyId: invite.agency_id,
      roles: invite.roles,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('Error accepting team invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
