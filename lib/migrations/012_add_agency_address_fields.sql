-- Add address fields to agencies table for invoice headers
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
