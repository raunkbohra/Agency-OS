-- Add billing_period column to invoices table
-- This tracks which billing period an invoice covers (e.g., '2026-03')
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS billing_period TEXT;

-- Create unique index to prevent duplicate invoices for the same client + period
-- Only applies where billing_period IS NOT NULL to allow multiple NULL billing_period rows
CREATE UNIQUE INDEX IF NOT EXISTS invoices_client_billing_period_unique
  ON invoices (client_id, billing_period)
  WHERE billing_period IS NOT NULL;
