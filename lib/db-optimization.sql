-- lib/db-optimization.sql
-- Add missing indexes for performance

CREATE INDEX IF NOT EXISTS idx_invoices_status_agency ON invoices(status, agency_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_month_year ON deliverables(month_year, agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_agency ON payment_transactions(status, agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_created ON clients(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status != 'paid';

-- Add database constraints for data integrity
ALTER TABLE invoices ADD CONSTRAINT check_valid_status CHECK (status IN ('draft', 'sent', 'payment_pending', 'paid'));
ALTER TABLE deliverables ADD CONSTRAINT check_deliverable_status CHECK (status IN ('draft', 'in_review', 'approved', 'changes_requested', 'done'));
