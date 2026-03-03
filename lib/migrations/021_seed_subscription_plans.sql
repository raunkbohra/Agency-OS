-- lib/migrations/021_seed_subscription_plans.sql
-- Seed pricing data for all 18 variants (3 tiers × 3 regions × 2 billing periods)

INSERT INTO subscription_plans (region, tier, billing_period, currency, amount_cents, max_clients, max_plans, max_team_members) VALUES
-- GLOBAL USD
('global', 'free', 'monthly', 'USD', 0, 2, 5, 1),
('global', 'free', 'yearly', 'USD', 0, 2, 5, 1),
('global', 'basic', 'monthly', 'USD', 900, 15, 50, 5),
('global', 'basic', 'yearly', 'USD', 8600, 15, 50, 5),
('global', 'pro', 'monthly', 'USD', 3900, NULL, NULL, NULL),
('global', 'pro', 'yearly', 'USD', 37400, NULL, NULL, NULL),

-- INDIA INR
('india', 'free', 'monthly', 'INR', 0, 2, 5, 1),
('india', 'free', 'yearly', 'INR', 0, 2, 5, 1),
('india', 'basic', 'monthly', 'INR', 19900, 15, 50, 5),
('india', 'basic', 'yearly', 'INR', 191000, 15, 50, 5),
('india', 'pro', 'monthly', 'INR', 69900, NULL, NULL, NULL),
('india', 'pro', 'yearly', 'INR', 671000, NULL, NULL, NULL),

-- NEPAL NPR
('nepal', 'free', 'monthly', 'NPR', 0, 2, 5, 1),
('nepal', 'free', 'yearly', 'NPR', 0, 2, 5, 1),
('nepal', 'basic', 'monthly', 'NPR', 39900, 15, 50, 5),
('nepal', 'basic', 'yearly', 'NPR', 383000, 15, 50, 5),
('nepal', 'pro', 'monthly', 'NPR', 129900, NULL, NULL, NULL),
('nepal', 'pro', 'yearly', 'NPR', 1247000, NULL, NULL, NULL);

-- Add features for each tier
UPDATE subscription_plans SET features = '{"invoicing": true, "basic_reporting": false, "api_access": false, "priority_support": false}' WHERE tier = 'free';
UPDATE subscription_plans SET features = '{"invoicing": true, "basic_reporting": true, "api_access": false, "priority_support": false}' WHERE tier = 'basic';
UPDATE subscription_plans SET features = '{"invoicing": true, "basic_reporting": true, "api_access": true, "priority_support": true}' WHERE tier = 'pro';
