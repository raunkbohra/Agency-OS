-- Add billing start policy to agencies
-- 'next_month'  → skip partial first month; deliverables + invoice start on 1st of next month
-- 'prorated'    → charge/deliver proportionally for the remaining days in the join month
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS billing_start_policy TEXT NOT NULL DEFAULT 'next_month';
