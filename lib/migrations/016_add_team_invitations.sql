-- lib/migrations/016_add_team_invitations.sql

-- Create agency_invites table for team invitations
CREATE TABLE agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  token TEXT NOT NULL UNIQUE,
  accepted BOOLEAN DEFAULT false,
  accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(agency_id, email)
);

-- Create user_roles table for user role assignments
CREATE TABLE user_roles (
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

-- Create indexes for better query performance
CREATE INDEX idx_agency_invites_token ON agency_invites(token);
CREATE INDEX idx_agency_invites_agency_id ON agency_invites(agency_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_agency_id ON user_roles(agency_id);
