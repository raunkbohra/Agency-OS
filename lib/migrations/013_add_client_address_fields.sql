-- Add address fields to clients table for invoice billing
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
