-- lib/migrations/006_add_payment_provider_tables.sql

CREATE TABLE IF NOT EXISTS payment_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  requires_credentials BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agency_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES payment_providers(id),
  credentials JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  provider_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  reference_id TEXT,
  webhook_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  verified BOOLEAN,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO payment_providers (id, name, description) VALUES
  ('bank_transfer', 'Bank Transfer', 'Manual bank transfer with receipt upload'),
  ('fonepay', 'FonePay', 'Nepal QR code payment'),
  ('stripe', 'Stripe', 'International card payments'),
  ('razorpay', 'Razorpay', 'India/South Asia payments'),
  ('esewa', 'Esewa', 'Nepal digital wallet');

CREATE INDEX IF NOT EXISTS idx_agency_payment_methods_agency_id ON agency_payment_methods(agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider_id ON payment_webhooks(provider_id);
