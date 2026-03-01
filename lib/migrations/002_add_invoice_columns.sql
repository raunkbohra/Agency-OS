-- lib/migrations/002_add_invoice_columns.sql
-- Add missing columns to invoices table for PDF generation

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing records to have updated_at = created_at
UPDATE invoices SET updated_at = created_at WHERE updated_at IS NULL;
