-- lib/migrations/015_add_client_auth.sql
-- Add client authentication columns and password reset tokens table

ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invite_accepted BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS client_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_password_reset_tokens_token ON client_password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_password_reset_tokens_client_id ON client_password_reset_tokens(client_id);
