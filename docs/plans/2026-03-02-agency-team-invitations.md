# Agency Team Invitations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add team invitation system allowing agencies to invite staff with role-based access control (Admin + Members with specific roles).

**Architecture:** Permanent invite tokens sent via email. Members assigned roles (Designer, Developer, PM, etc.) with access to deliverables matching their roles. Admin-only team management UI at `/dashboard/settings/team`.

**Tech Stack:** NextAuth (existing), PostgreSQL, jose (JWT), Nodemailer (existing email setup), React hooks for UI

---

## Task 1: Database Migration

**Files:**
- Create: `lib/migrations/016_add_team_invitations.sql`

**Step 1: Write migration with all schema changes**

```sql
-- lib/migrations/016_add_team_invitations.sql
-- Add team invitation and role system

-- New table: agency_invites
CREATE TABLE IF NOT EXISTS agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT false,
  accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE agency_invites ADD CONSTRAINT unique_agency_email UNIQUE(agency_id, email);
CREATE INDEX idx_agency_invites_token ON agency_invites(token);
CREATE INDEX idx_agency_invites_agency_id ON agency_invites(agency_id);

-- New table: user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_roles ADD CONSTRAINT unique_user_agency_role UNIQUE(user_id, agency_id, role);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_agency_id ON user_roles(agency_id);

-- Add columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_role TEXT;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT '{}';
```

**Step 2: Run migration**

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/016_add_team_invitations.sql
```

Expected: No errors, tables created successfully

**Step 3: Verify schema**

```bash
psql postgresql://raunakbohra@localhost/agency_os -c "\d agency_invites; \d user_roles;"
```

Expected: Both tables visible with correct columns and indexes

**Step 4: Commit**

```bash
git add lib/migrations/016_add_team_invitations.sql
git commit -m "db: add agency_invites and user_roles tables for team management"
```

---

## Task 2: Database Query Functions

**Files:**
- Modify: `lib/db-queries.ts`

**Step 1: Add type definitions**

Add to `lib/db-queries.ts`:

```typescript
export interface AgencyInvite {
  id: string;
  agency_id: string;
  email: string;
  roles: string[];
  token: string;
  accepted: boolean;
  accepted_by_user_id: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  agency_id: string;
  role: string;
  created_at: string;
}
```

**Step 2: Add invite functions**

Add to `lib/db-queries.ts`:

```typescript
// Create invite
export async function createAgencyInvite(
  agencyId: string,
  email: string,
  roles: string[],
  token: string
): Promise<AgencyInvite> {
  try {
    const result = await db.query(
      `INSERT INTO agency_invites (agency_id, email, roles, token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (agency_id, email) DO UPDATE
       SET roles = $3, token = $4, accepted = false
       RETURNING *`,
      [agencyId, email, roles, token]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create agency invite:', err);
    throw new Error('Failed to create agency invite');
  }
}

// Get invite by token
export async function getAgencyInviteByToken(token: string): Promise<AgencyInvite | null> {
  try {
    const result = await db.query(
      `SELECT * FROM agency_invites WHERE token = $1 AND accepted = false`,
      [token]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get agency invite:', err);
    throw new Error('Failed to get agency invite');
  }
}

// Accept invite
export async function acceptAgencyInvite(token: string, userId: string): Promise<void> {
  try {
    await db.query(
      `UPDATE agency_invites
       SET accepted = true, accepted_by_user_id = $2
       WHERE token = $1`,
      [token, userId]
    );
  } catch (err) {
    console.error('Failed to accept invite:', err);
    throw new Error('Failed to accept invite');
  }
}

// Get invites for agency
export async function getAgencyInvites(agencyId: string): Promise<AgencyInvite[]> {
  try {
    const result = await db.query(
      `SELECT * FROM agency_invites WHERE agency_id = $1 ORDER BY created_at DESC`,
      [agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get agency invites:', err);
    throw new Error('Failed to get agency invites');
  }
}
```

**Step 3: Add role functions**

Add to `lib/db-queries.ts`:

```typescript
// Assign role to user
export async function assignUserRole(userId: string, agencyId: string, role: string): Promise<void> {
  try {
    await db.query(
      `INSERT INTO user_roles (user_id, agency_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [userId, agencyId, role]
    );
  } catch (err) {
    console.error('Failed to assign user role:', err);
    throw new Error('Failed to assign user role');
  }
}

// Get user roles in agency
export async function getUserRolesInAgency(userId: string, agencyId: string): Promise<string[]> {
  try {
    const result = await db.query(
      `SELECT role FROM user_roles WHERE user_id = $1 AND agency_id = $2`,
      [userId, agencyId]
    );
    return result.rows.map((r: any) => r.role);
  } catch (err) {
    console.error('Failed to get user roles:', err);
    throw new Error('Failed to get user roles');
  }
}

// Update user roles (replace all)
export async function updateUserRoles(userId: string, agencyId: string, roles: string[]): Promise<void> {
  try {
    await db.query('BEGIN');
    // Delete existing roles
    await db.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND agency_id = $2`,
      [userId, agencyId]
    );
    // Insert new roles
    for (const role of roles) {
      await db.query(
        `INSERT INTO user_roles (user_id, agency_id, role) VALUES ($1, $2, $3)`,
        [userId, agencyId, role]
      );
    }
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Failed to update user roles:', err);
    throw new Error('Failed to update user roles');
  }
}

// Get team members for agency
export async function getAgencyTeamMembers(agencyId: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    roles: string[];
    joinedAt: string;
    isOwner: boolean;
  }>
> {
  try {
    const result = await db.query(
      `SELECT DISTINCT
         u.id,
         u.name,
         u.email,
         u.created_at as joinedAt,
         (u.agency_id = $1 AND u.role = 'owner') as isOwner
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.agency_id = $1
       WHERE u.agency_id = $1 OR ur.agency_id = $1
       ORDER BY u.created_at ASC`,
      [agencyId]
    );

    const membersMap = new Map();
    for (const row of result.rows) {
      if (!membersMap.has(row.id)) {
        membersMap.set(row.id, {
          id: row.id,
          name: row.name,
          email: row.email,
          roles: [],
          joinedAt: row.joinedat,
          isOwner: row.isowner,
        });
      }
      if (row.role) {
        membersMap.get(row.id).roles.push(row.role);
      }
    }
    return Array.from(membersMap.values());
  } catch (err) {
    console.error('Failed to get team members:', err);
    throw new Error('Failed to get team members');
  }
}

// Remove user from agency
export async function removeUserFromAgency(userId: string, agencyId: string): Promise<void> {
  try {
    // Delete user roles
    await db.query(
      `DELETE FROM user_roles WHERE user_id = $1 AND agency_id = $2`,
      [userId, agencyId]
    );
    // Optionally mark user as inactive or remove them entirely
    // For now, keep the user record but they have no roles
  } catch (err) {
    console.error('Failed to remove user from agency:', err);
    throw new Error('Failed to remove user from agency');
  }
}
```

**Step 4: Run tests (test the new functions)**

Create a quick test:
```bash
psql postgresql://raunakbohra@localhost/agency_os << 'EOF'
-- Test invite creation
INSERT INTO agencies (name, owner_id, currency) VALUES ('Test Agency', (SELECT id FROM users LIMIT 1), 'USD')
RETURNING id;
-- Should succeed
EOF
```

**Step 5: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add database query functions for team invites and roles"
```

---

## Task 3: Email Template and Function

**Files:**
- Modify: `lib/email.ts`

**Step 1: Add team invite email function**

Add to `lib/email.ts`:

```typescript
export async function sendTeamInviteEmail(options: {
  to: string;
  memberName: string;
  agencyName: string;
  roles: string[];
  inviteUrl: string;
}): Promise<void> {
  const { to, memberName, agencyName, roles, inviteUrl } = options;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; }
    .header { margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: bold; margin: 0 0 8px 0; }
    .subtitle { font-size: 14px; color: #666; margin: 0; }
    .content { margin: 24px 0; line-height: 1.6; }
    .roles-list { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0; border-radius: 4px; }
    .role { margin: 4px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 24px 0; }
    .footer { font-size: 12px; color: #999; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 class="title">You're invited!</h1>
        <p class="subtitle">Join ${escapeHtml(agencyName)}</p>
      </div>

      <div class="content">
        <p>Hi ${escapeHtml(memberName)},</p>

        <p>You've been invited to join <strong>${escapeHtml(agencyName)}</strong> as:</p>

        <div class="roles-list">
          ${roles.map(role => `<div class="role">• ${escapeHtml(role)}</div>`).join('')}
        </div>

        <p>Click the button below to accept the invitation:</p>

        <a href="${escapeHtml(inviteUrl)}" class="button">Accept Invitation</a>

        <p style="font-size: 12px; color: #666;">Or copy this link: <code>${escapeHtml(inviteUrl)}</code></p>

        <p>This invitation link doesn't expire, so you can accept it anytime.</p>
      </div>

      <div class="footer">
        <p>If you have questions, contact ${escapeHtml(agencyName)}.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await sendEmail({
    to,
    subject: `You're invited to join ${agencyName}`,
    html: htmlContent,
  });
}
```

**Step 2: Verify escapeHtml exists**

Check if `escapeHtml` function exists in `lib/email.ts`. If not, add:

```typescript
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}
```

**Step 3: Test email rendering**

```bash
# Just verify the function is syntactically correct
npm run build 2>&1 | grep -i error | head -5
```

**Step 4: Commit**

```bash
git add lib/email.ts
git commit -m "feat: add team invite email template"
```

---

## Task 4: POST /api/dashboard/team/invite Endpoint

**Files:**
- Create: `app/api/dashboard/team/invite/route.ts`

**Step 1: Create the endpoint**

```typescript
// app/api/dashboard/team/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createAgencyInvite, getAgencyById } from '@/lib/db-queries';
import { sendTeamInviteEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Auth check
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agency ID from session
    const agencyId = (session.user as any).agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 400 });
    }

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
```

**Step 2: Test endpoint**

```bash
# Test with curl (requires valid auth session)
AGENCY_ID="29a57b33-c39b-483e-9301-ed5f51d3aa82"

curl -s -X POST http://localhost:3000/api/dashboard/team/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"designer@test.com","roles":["Designer"]}' | jq .
```

Expected: Success response with inviteId

**Step 3: Commit**

```bash
git add app/api/dashboard/team/invite/route.ts
git commit -m "feat: add POST /api/dashboard/team/invite endpoint"
```

---

## Task 5: POST /api/auth/accept-team-invite/[token] Endpoint

**Files:**
- Create: `app/api/auth/accept-team-invite/route.ts`

**Step 1: Create the endpoint**

```typescript
// app/api/auth/accept-team-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAgencyInviteByToken, acceptAgencyInvite, getUserById, createUser, assignUserRole } from '@/lib/db-queries';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.pathname.split('/').pop();

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
      user = await createUser({
        email: invite.email,
        name,
        password_hash: passwordHash,
        agency_id: invite.agency_id,
        role: 'member',
      });
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
```

**Step 2: Test endpoint**

```bash
# First get a valid invite token (from the invite sent in Task 4)
# Then test:
curl -s -X POST http://localhost:3000/api/auth/accept-team-invite/[TOKEN] \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Designer","password":"secure123"}' | jq .
```

Expected: Success response with agencyId and roles

**Step 3: Commit**

```bash
git add app/api/auth/accept-team-invite/route.ts
git commit -m "feat: add POST /api/auth/accept-team-invite endpoint"
```

---

## Task 6: GET /api/dashboard/team/members Endpoint

**Files:**
- Create: `app/api/dashboard/team/members/route.ts`

**Step 1: Create the endpoint**

```typescript
// app/api/dashboard/team/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAgencyTeamMembers } from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = (session.user as any).agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 400 });
    }

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
```

**Step 2: Test endpoint**

```bash
curl -s http://localhost:3000/api/dashboard/team/members \
  -H "Cookie: [SESSION_COOKIE]" | jq .
```

Expected: Array of members with roles

**Step 3: Commit**

```bash
git add app/api/dashboard/team/members/route.ts
git commit -m "feat: add GET /api/dashboard/team/members endpoint"
```

---

## Task 7: PATCH /api/dashboard/team/[userId] Endpoint

**Files:**
- Create: `app/api/dashboard/team/[userId]/route.ts`

**Step 1: Create the endpoint**

```typescript
// app/api/dashboard/team/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAgencyById, updateUserRoles } from '@/lib/db-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = (session.user as any).agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 400 });
    }

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

    const userId = params.userId;

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
```

**Step 2: Test endpoint**

```bash
curl -s -X PATCH http://localhost:3000/api/dashboard/team/[USER_ID] \
  -H "Content-Type: application/json" \
  -H "Cookie: [SESSION_COOKIE]" \
  -d '{"roles":["Designer","Developer"]}' | jq .
```

Expected: Success response with updated roles

**Step 3: Commit**

```bash
git add app/api/dashboard/team/[userId]/route.ts
git commit -m "feat: add PATCH /api/dashboard/team/[userId] endpoint"
```

---

## Task 8: DELETE /api/dashboard/team/[userId] Endpoint

**Files:**
- Modify: `app/api/dashboard/team/[userId]/route.ts` (add DELETE)

**Step 1: Add DELETE handler to existing file**

Add to `app/api/dashboard/team/[userId]/route.ts`:

```typescript
import { removeUserFromAgency } from '@/lib/db-queries';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = (session.user as any).agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 400 });
    }

    // Check if user is owner
    const agency = await getAgencyById(agencyId);
    if (!agency || agency.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only agency owner can remove members' }, { status: 403 });
    }

    const userId = params.userId;

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
```

**Step 2: Test endpoint**

```bash
curl -s -X DELETE http://localhost:3000/api/dashboard/team/[USER_ID] \
  -H "Cookie: [SESSION_COOKIE]" | jq .
```

Expected: Success response with "Member removed"

**Step 3: Commit**

```bash
git add app/api/dashboard/team/[userId]/route.ts
git commit -m "feat: add DELETE /api/dashboard/team/[userId] endpoint"
```

---

## Task 9: /dashboard/settings/team Page

**Files:**
- Create: `app/dashboard/settings/team/page.tsx`
- Create: `components/TeamManagement.tsx`

**Step 1: Create main page component**

```typescript
// app/dashboard/settings/team/page.tsx
'use client';

import { useEffect, useState } from 'react';
import TeamManagement from '@/components/TeamManagement';

export default function TeamPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Team Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Invite team members and manage their roles
          </p>
        </div>

        <TeamManagement />
      </div>
    </div>
  );
}
```

**Step 2: Create TeamManagement component**

```typescript
// components/TeamManagement.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Trash2, Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roles: string[];
  joinedAt: string;
  isOwner: boolean;
}

const AVAILABLE_ROLES = ['Designer', 'Developer', 'Project Manager', 'Account Manager'];

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/dashboard/team/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      setError('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || selectedRoles.length === 0) return;

    setSending(true);
    try {
      const res = await fetch('/api/dashboard/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, roles: selectedRoles }),
      });

      if (!res.ok) throw new Error('Failed to send invite');

      setInviteEmail('');
      setSelectedRoles([]);
      await fetchMembers();
    } catch (err) {
      setError('Failed to send invite');
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleUpdateRoles(userId: string) {
    try {
      const res = await fetch(`/api/dashboard/team/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: editRoles }),
      });

      if (!res.ok) throw new Error('Failed to update roles');
      setEditingUser(null);
      await fetchMembers();
    } catch (err) {
      setError('Failed to update roles');
      console.error(err);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this team member?')) return;

    try {
      const res = await fetch(`/api/dashboard/team/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove member');
      await fetchMembers();
    } catch (err) {
      setError('Failed to remove member');
      console.error(err);
    }
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleEditRole = (role: string) => {
    setEditRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div
          className="p-4 rounded-lg border"
          style={{
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            color: 'var(--accent-red)',
          }}
        >
          {error}
        </div>
      )}

      {/* Invite Section */}
      <div
        className="rounded-lg border p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Invite Team Member
        </h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="designer@example.com"
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Roles
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_ROLES.map(role => (
                <label key={role} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>{role}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !inviteEmail || selectedRoles.length === 0}
            className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-blue)' }}
          >
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div
        className="rounded-lg border p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-default)',
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Team Members ({members.length})
        </h2>

        <div className="space-y-3">
          {members.map(member => (
            <div
              key={member.id}
              className="p-4 rounded-lg border flex items-center justify-between"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              {editingUser === member.id ? (
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    {AVAILABLE_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editRoles.includes(role)}
                          onChange={() => toggleEditRole(role)}
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateRoles(member.id)}
                      className="px-3 py-1 rounded text-sm"
                      style={{ background: 'var(--accent-blue)', color: 'white' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1 rounded text-sm border"
                      style={{ borderColor: 'var(--border-default)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {member.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {member.email}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {member.isOwner && (
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent-blue)',
                          }}
                        >
                          Owner
                        </span>
                      )}
                      {member.roles.map(role => (
                        <span
                          key={role}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            background: 'rgba(107, 126, 147, 0.1)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!member.isOwner && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(member.id);
                          setEditRoles(member.roles);
                        }}
                        className="p-2 rounded hover:opacity-75"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-2 rounded hover:opacity-75"
                        style={{ color: 'var(--accent-red)' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update dashboard settings layout to include team link**

Check if `/dashboard/settings/layout.tsx` exists and add navigation link to team page.

**Step 3: Test page**

```bash
# Navigate to http://localhost:3000/dashboard/settings/team
# Should show invite form and team members list
```

**Step 4: Commit**

```bash
git add app/dashboard/settings/team/page.tsx components/TeamManagement.tsx
git commit -m "feat: add team management UI page"
```

---

## Task 10: /auth/join-team/[token] Page

**Files:**
- Create: `app/auth/join-team/[token]/page.tsx`
- Create: `components/JoinTeamForm.tsx`

**Step 1: Create main page**

```typescript
// app/auth/join-team/[token]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import JoinTeamForm from '@/components/JoinTeamForm';

export default function JoinTeamPage() {
  const params = useParams();
  const token = params.token as string;
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInvite() {
      try {
        // In a real app, we'd fetch invite details to show agency name, roles, etc
        // For now, just mark as loaded
        setInviteData({ token });
      } catch (err) {
        setError('Failed to load invite');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--accent-red)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return <JoinTeamForm token={token} />;
}
```

**Step 2: Create JoinTeamForm component**

```typescript
// components/JoinTeamForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface JoinTeamFormProps {
  token: string;
}

export default function JoinTeamForm({ token }: JoinTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useExistingAccount, setUseExistingAccount] = useState(!!session);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!useExistingAccount && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const res = await fetch(`/api/auth/accept-team-invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          useExistingAccount
            ? { userId: session?.user?.id }
            : { name, password }
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      const data = await res.json();
      router.push(data.redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-[400px] px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Join Team
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>You've been invited to join an agency</p>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              color: 'var(--accent-red)',
            }}
          >
            {error}
          </div>
        )}

        {session ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p style={{ color: 'var(--text-primary)' }}>
              Logged in as <strong>{session.user?.email}</strong>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent-blue)' }}
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-2 rounded-lg border"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name || !password || !confirmPassword}
              className="w-full px-4 py-3 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent-blue)' }}
            >
              {loading ? 'Creating Account...' : 'Create Account & Join Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Test page**

```bash
# Get a valid invite token from Task 4
# Navigate to http://localhost:3000/auth/join-team/[TOKEN]
# Should show invite form
```

**Step 4: Commit**

```bash
git add app/auth/join-team/[token]/page.tsx components/JoinTeamForm.tsx
git commit -m "feat: add join team page with invite acceptance flow"
```

---

## Task 11: Authorization Checks & Role-Based Access

**Files:**
- Modify: `lib/db-queries.ts` (add helper function)
- Modify: `app/api/deliverables/[id]/route.ts` (or relevant deliverable endpoints)

**Step 1: Add authorization helper**

Add to `lib/db-queries.ts`:

```typescript
// Check if user can edit deliverable based on roles
export async function canUserEditDeliverable(
  userId: string,
  deliverableId: string,
  agencyId: string
): Promise<boolean> {
  try {
    // Get deliverable
    const delivRes = await db.query(
      `SELECT required_roles FROM deliverables WHERE id = $1 AND agency_id = $2`,
      [deliverableId, agencyId]
    );

    if (!delivRes.rows[0]) return false;

    const requiredRoles = delivRes.rows[0].required_roles || [];

    // If no roles required, anyone can edit
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Get user roles
    const userRoles = await getUserRolesInAgency(userId, agencyId);

    // Check if user has at least one required role
    return userRoles.some(role => requiredRoles.includes(role));
  } catch (err) {
    console.error('Failed to check deliverable permissions:', err);
    return false;
  }
}
```

**Step 2: Add check to deliverable update endpoint**

In any deliverable PATCH/PUT endpoint, add:

```typescript
// Before updating deliverable
const canEdit = await canUserEditDeliverable(userId, deliverableId, agencyId);
if (!canEdit) {
  return NextResponse.json(
    { error: 'You do not have permission to edit this deliverable' },
    { status: 403 }
  );
}
```

**Step 3: Test authorization**

```bash
# Test 1: Member with role can edit
# Test 2: Member without role cannot edit
# Test 3: Admin can always edit
```

**Step 4: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add role-based authorization for deliverable editing"
```

---

## Task 12: Integration Tests

**Files:**
- Create: `__tests__/team-invitations.test.ts`

**Step 1: Write integration test**

```typescript
// __tests__/team-invitations.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/lib/db';

describe('Team Invitations', () => {
  let agencyId: string;
  let userId: string;
  let inviteToken: string;

  beforeAll(async () => {
    // Setup: Create test agency and user
    const agencyRes = await db.query(
      `INSERT INTO agencies (name, owner_id, currency)
       VALUES ($1, $2, $3) RETURNING id`,
      ['Test Agency', '...', 'USD']
    );
    agencyId = agencyRes.rows[0].id;
  });

  it('should create and accept team invitation', async () => {
    // Test invite creation
    // Test acceptance
    // Verify user roles assigned
  });

  it('should prevent non-owner from inviting', async () => {
    // Test authorization
  });

  it('should block editing deliverables without matching role', async () => {
    // Test role-based access
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

**Step 2: Run tests**

```bash
npm test __tests__/team-invitations.test.ts
```

**Step 3: Commit**

```bash
git add __tests__/team-invitations.test.ts
git commit -m "test: add integration tests for team invitations"
```

---

## Final Verification

### Acceptance Criteria Checklist

- [ ] Admin can invite team members by email with multiple roles
- [ ] Invites have permanent tokens (no expiration)
- [ ] New users can create account via invite link
- [ ] Existing users can join agency via invite link
- [ ] Members see all deliverables but only edit matching their role
- [ ] Admin can update member roles
- [ ] Admin can remove members
- [ ] Removed members lose access immediately
- [ ] Team list shows members and their roles
- [ ] Role-based access prevents unauthorized edits
- [ ] All endpoints properly authenticated/authorized

### Manual Testing Workflow

1. **Create invite**: Admin sends invite to new@example.com with ["Designer"] role
2. **New user joins**: new@example.com clicks link, creates account
3. **Verify access**: New user logs in, sees all deliverables, can only edit Designer tasks
4. **Update roles**: Admin adds "Developer" role
5. **Verify updated**: User can now edit both Designer and Developer tasks
6. **Remove member**: Admin removes member
7. **Verify removal**: Removed user cannot access agency

---

## Deployment Notes

- Requires NEXT_PUBLIC_BASE_URL environment variable for email links
- Add EMAIL_FROM environment variable for sending invites
- Database migration must be run before deployment
- Consider rate limiting on /api/dashboard/team/invite to prevent spam
