-- lib/migrations/014_add_contract_signing_tokens.sql

-- Add signature_image column to contract_signatures if it doesn't exist
ALTER TABLE contract_signatures
  ADD COLUMN IF NOT EXISTS signature_image TEXT;

-- Create contract_signing_tokens table for tracking signing tokens and verification
CREATE TABLE contract_signing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  signed BOOLEAN DEFAULT false,
  verification_code TEXT,
  code_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX idx_contract_signing_tokens_token ON contract_signing_tokens(token);
CREATE INDEX idx_contract_signing_tokens_contract_id ON contract_signing_tokens(contract_id);
