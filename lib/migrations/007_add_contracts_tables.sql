-- lib/migrations/006_add_contracts_tables.sql

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_plan_id UUID NOT NULL REFERENCES client_plans(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signed_date TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scope_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id),
  alert_type TEXT,
  threshold_exceeded DECIMAL,
  status TEXT DEFAULT 'active',
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_signed ON contracts(signed);
CREATE INDEX idx_scope_alerts_client_id ON scope_alerts(client_id);
CREATE INDEX idx_scope_alerts_status ON scope_alerts(status);
