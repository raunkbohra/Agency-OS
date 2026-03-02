# Design: Agency Team Invitation System

## Overview

Agencies currently have no way to invite team members. This design adds a team invitation system with role-based access control, allowing agencies to build teams with Members having limited, role-specific access to client work.

## Requirements

- Invite team members via email with permanent (non-expiring) links
- Two-tier permission model: Owner/Admin and Member
- Members assigned one or more roles (Designer, Developer, PM, etc.)
- Members see all projects/deliverables for context but can only edit work tagged with their roles
- Admins manage team, set roles, remove members

## Architecture

### Permission Model

**Owner/Admin:**
- Full access to all features
- Manage team (invite, remove, update roles)
- Access agency settings, billing, bank details
- Create clients and plans
- Edit all deliverables, invoices, contracts

**Member:**
- Cannot access agency settings, billing, or team management
- Cannot create clients or plans
- Can view all deliverables/invoices/contracts (visibility)
- Can only *edit* deliverables tagged with their assigned roles
- Cannot invite other members

### Role-Based Access

Each member has one or more roles:
- Designer
- Developer
- Project Manager
- Account Manager
- (Custom roles as needed)

When a deliverable is created, it's tagged with required roles. Members can edit it if their assigned roles match.

Example:
- Deliverable "Landing page design" tagged with ["Designer"]
- Member "Alice" with role ["Designer"] can edit it
- Member "Bob" with roles ["Developer", "PM"] cannot edit (no Designer role)

## Database Schema

### New Table: `agency_invites`

```sql
CREATE TABLE agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL,  -- Array: ["Designer", "Developer"]
  token TEXT NOT NULL UNIQUE,  -- 64-char hex token
  accepted BOOLEAN DEFAULT false,
  accepted_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(agency_id, email)  -- One invite per email per agency
);

CREATE INDEX idx_agency_invites_token ON agency_invites(token);
CREATE INDEX idx_agency_invites_agency_id ON agency_invites(agency_id);
```

### New Table: `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,  -- "Designer", "Developer", etc.
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, agency_id, role)  -- No duplicate role assignments
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_agency_id ON user_roles(agency_id);
```

### Updated: `users` Table

Add column:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_role TEXT;
```

### Updated: `deliverables` Table

Add column:
```sql
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT '{}';
```

## API Endpoints

### POST /api/dashboard/team/invite

**Authentication:** Session (Admin only)

**Request:**
```json
{
  "email": "designer@example.com",
  "roles": ["Designer", "Developer"]
}
```

**Response:**
```json
{
  "success": true,
  "inviteId": "...",
  "message": "Invite sent to designer@example.com"
}
```

**Actions:**
1. Validate user is Admin
2. Generate 64-char invite token
3. Insert into `agency_invites`
4. Send email with `/auth/join-team/[token]` link
5. Return success

### POST /api/auth/accept-team-invite/[token]

**Authentication:** None (public, token-gated)

**Request (if creating new account):**
```json
{
  "name": "Alice Designer",
  "password": "secure123"
}
```

**Request (if existing user):**
```json
{
  "userId": "..."  // or just use session if logged in
}
```

**Response:**
```json
{
  "success": true,
  "agencyId": "...",
  "roles": ["Designer"],
  "redirectTo": "/dashboard"
}
```

**Actions:**
1. Validate token exists and not yet accepted
2. If new user: create account with hashed password
3. If existing user: add to agency
4. Insert into `user_roles` for each role
5. Mark invite as accepted
6. Create session and redirect to dashboard

### GET /api/dashboard/team/members

**Authentication:** Session (any authenticated user in agency)

**Response:**
```json
{
  "members": [
    {
      "id": "...",
      "name": "Alice Designer",
      "email": "alice@example.com",
      "roles": ["Designer"],
      "joinedAt": "2026-03-02T...",
      "isOwner": false
    }
  ]
}
```

### PATCH /api/dashboard/team/[userId]

**Authentication:** Session (Admin only)

**Request:**
```json
{
  "roles": ["Designer", "Developer"]  // Replace existing roles
}
```

**Response:**
```json
{
  "success": true,
  "userId": "...",
  "roles": ["Designer", "Developer"]
}
```

### DELETE /api/dashboard/team/[userId]

**Authentication:** Session (Admin only)

**Response:**
```json
{
  "success": true,
  "message": "Member removed"
}
```

**Actions:**
1. Validate user is Admin
2. Delete from `user_roles`
3. Remove user from agency (or mark as inactive)
4. Revoke session tokens

## UI Pages

### /dashboard/settings/team

**List & Invite:**
- Show current team members with their roles
- "Invite Team Member" button opens modal
- Invite form: email + role multi-select
- List shows: Name, Email, Roles, Join Date, Actions (Edit/Remove)
- Edit modal: Update member's roles
- Remove with confirmation dialog

### /auth/join-team/[token]

**Accept Invite Page:**
- Show: "You've been invited to join [Agency Name] as [Role 1, Role 2]"
- If new user: Show signup form (name, password)
- If logged in as different user: Show "Sign out and try again" or "Use this account"
- If token invalid/expired: Show error message
- On accept: Create account + join agency + redirect to /dashboard

## Email Template

**Subject:** You're invited to join [Agency Name]

**Body (HTML):**
```
Hi [Name],

You've been invited to join [Agency Name] as:
- [Role 1]
- [Role 2]

Click the button below to accept the invitation:
[Accept Invitation Button: /auth/join-team/[token]]

This invitation link doesn't expire, so you can accept it anytime.

Best,
[Agency Name] Team
```

## Authorization Checks

**Dashboard Pages:**
- `/dashboard/settings/team` — Admin only
- Other dashboard pages — Member+ (can access if member of agency)

**Deliverable Editing:**
- Admin can edit all deliverables
- Member can edit deliverable if:
  - `deliverable.required_roles` is empty (any role can edit), OR
  - User's roles include at least one role in `deliverable.required_roles`

## Error Handling

- Invalid/expired token → 404 "Invitation not found"
- Email already invited → 409 "Invitation already sent to this email"
- Duplicate role assignment → Silently ignore (upsert)
- Member trying to remove self → 403 "Cannot remove yourself"
- Last admin trying to be removed → 403 "Agency must have at least one admin"

## Success Criteria

1. Admin can invite team members by email with roles
2. Invites are permanent (no expiration)
3. New users can create account via invite link
4. Existing users can join agency via invite link
5. Members see all deliverables but can only edit assigned roles
6. Admin can update member roles
7. Admin can remove members
8. Removed members lose access immediately
9. Team list shows current members and their roles
