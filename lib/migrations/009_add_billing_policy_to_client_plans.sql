-- Add billing_start_policy to client_plans so it's per-client, not global
ALTER TABLE client_plans
  ADD COLUMN IF NOT EXISTS billing_start_policy TEXT NOT NULL DEFAULT 'next_month';
