-- lib/migrations/003_add_payments_table.sql
-- Add payments table for bank transfer tracking

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  provider TEXT DEFAULT 'bank_transfer',
  status TEXT DEFAULT 'pending',
  reference_id TEXT,
  receipt_url TEXT,
  meta_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_agency_id ON payments(agency_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Note: RLS is disabled for MVP (enforcing at application level via NextAuth)
-- When migrating to Supabase, enable RLS with proper auth.uid() context
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users_see_own_payments" ON payments
--   USING (
--     invoice_id IN (
--       SELECT id FROM invoices WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
--     )
--   );
