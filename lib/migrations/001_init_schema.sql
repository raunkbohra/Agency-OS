-- lib/migrations/001_init_schema.sql
-- Core database schema for Agency OS MVP
-- Adapted for local PostgreSQL (not Supabase)

-- Create agencies table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  currency TEXT DEFAULT 'NPR',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table with RLS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'member',
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTE: RLS disabled for MVP (enforcing at application level via NextAuth)
-- When migrating to Supabase, enable RLS with proper auth.uid() context

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create plan_items table
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  deliverable_type TEXT NOT NULL,
  qty INT DEFAULT 1,
  recurrence TEXT DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create client_plans (subscriptions) table
CREATE TABLE client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  start_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'draft',
  due_date TIMESTAMP,
  paid_date TIMESTAMP,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  rate DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_plans_agency_id ON plans(agency_id);
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_client_plans_client_id ON client_plans(client_id);
CREATE INDEX idx_client_plans_plan_id ON client_plans(plan_id);
CREATE INDEX idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
