-- lib/migrations/020_subscription_tables.sql
-- Subscription plans, agency subscriptions, and change history

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('global', 'india', 'nepal')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  currency TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  razorpay_plan_id TEXT,
  max_clients INTEGER,
  max_plans INTEGER,
  max_team_members INTEGER,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscription_plans_unique
  ON subscription_plans(region, tier, billing_period);

CREATE TABLE agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'fonepay')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'paused', 'cancelled')),
  stripe_subscription_id TEXT,
  razorpay_subscription_id TEXT,
  fonepay_order_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agency_subscriptions_agency_id ON agency_subscriptions(agency_id);
CREATE INDEX idx_agency_subscriptions_status ON agency_subscriptions(status);

CREATE TABLE subscription_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  from_tier TEXT,
  to_tier TEXT,
  change_type TEXT CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation')),
  effective_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_change_history_agency_id ON subscription_change_history(agency_id);

-- Note: RLS policies require Supabase auth schema. Configure in production if using Supabase.
-- For local development, use application-level authorization checks.
