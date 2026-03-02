-- lib/migrations/016_add_team_invitations.sql

-- Create agency_invites table for team invitations
CREATE TABLE IF NOT EXISTS agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT false,
  accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Create user_roles table for user role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, agency_id, role)
);

-- Add default_role column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_role TEXT;

-- Add required_roles column to deliverables table
ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS required_roles TEXT[] DEFAULT '{}';

-- Add expires_at column to agency_invites table
ALTER TABLE agency_invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days');

-- Create indexes for better query performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_invites_unique_pending ON agency_invites(agency_id, email) WHERE accepted = false;
CREATE INDEX IF NOT EXISTS idx_agency_invites_agency_id ON agency_invites(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_agency_id ON user_roles(agency_id);
