-- Add signature_url column to store R2 URLs instead of base64
ALTER TABLE contract_signatures
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contract_signatures_url ON contract_signatures(signature_url);
