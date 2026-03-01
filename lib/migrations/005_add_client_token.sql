-- lib/migrations/005_add_client_token.sql
-- Add token field to clients table for portal access

ALTER TABLE clients ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_clients_token ON clients(token);
