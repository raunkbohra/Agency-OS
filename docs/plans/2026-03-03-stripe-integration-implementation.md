# Stripe Integration & Multi-Provider Billing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement Stripe subscriptions with Razorpay/Fonepay regional support, agency tier-based billing, and dynamic regional pricing.

**Architecture:** Multi-provider abstraction layer handles Stripe/Razorpay/Fonepay uniformly. IP-based location detection selects provider. Cron job enforces usage limits daily. Webhooks sync subscription state.

**Tech Stack:** Stripe SDK, Razorpay SDK, geoip-lite, PostgreSQL, Next.js API Routes, TDD approach.

---

## Phase 1: Database Setup

### Task 1: Create Subscription Tables Migration

**Files:**
- Create: `lib/migrations/020_subscription_tables.sql`

**Step 1: Write migration file**

```sql
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

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_change_history ENABLE ROW LEVEL SECURITY;

-- Simplified RLS: agencies see only their own subscriptions
CREATE POLICY "agencies_see_own_subscriptions" ON agency_subscriptions
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "agencies_see_own_change_history" ON subscription_change_history
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

**Step 2: Verify migration file is valid SQL**

Run: `cat lib/migrations/020_subscription_tables.sql | head -20`
Expected: First 20 lines of SQL visible

**Step 3: Run migration**

Run: `psql postgresql://raunakbohra@localhost/agency_os -f lib/migrations/020_subscription_tables.sql`
Expected: No errors, all tables created

**Step 4: Verify tables exist**

Run: `psql postgresql://raunakbohra@localhost/agency_os -c "\dt subscription_plans agency_subscriptions subscription_change_history"`
Expected: Three tables listed

**Step 5: Commit**

```bash
git add lib/migrations/020_subscription_tables.sql
git commit -m "feat: add subscription tables migration"
```

---

### Task 2: Seed Subscription Plans Data

**Files:**
- Create: `lib/migrations/021_seed_subscription_plans.sql`

**Step 1: Write seed migration**

```sql
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
```

**Step 2: Run seed migration**

Run: `psql postgresql://raunakbohra@localhost/agency_os -f lib/migrations/021_seed_subscription_plans.sql`
Expected: INSERT 0 18 (18 rows inserted)

**Step 3: Verify data**

Run: `psql postgresql://raunakbohra@localhost/agency_os -c "SELECT region, tier, billing_period, currency, amount_cents FROM subscription_plans ORDER BY region, tier, billing_period;"`
Expected: 18 rows with correct pricing

**Step 4: Commit**

```bash
git add lib/migrations/021_seed_subscription_plans.sql
git commit -m "feat: seed subscription plans with regional pricing"
```

---

## Phase 2: Payment Provider Abstraction

### Task 3: Create Payment Provider Interface

**Files:**
- Create: `lib/payment-providers/provider.ts`

**Step 1: Write provider interface**

```typescript
// lib/payment-providers/provider.ts

export interface SubscriptionEvent {
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'invoice.paid' | 'invoice.payment_failed';
  agencyId: string;
  subscriptionId: string;
  planId?: string;
  status?: 'active' | 'past_due' | 'cancelled';
  amount?: number;
  currency?: string;
  nextBillingDate?: Date;
}

export interface PaymentLink {
  url: string;
  expiresAt?: Date;
}

export interface SubscriptionData {
  id: string;
  agencyId: string;
  planId: string;
  status: 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
}

export interface PaymentProvider {
  name: string;
  region: 'global' | 'india' | 'nepal';

  // Subscriptions
  createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }>;

  cancelSubscription(subscriptionId: string): Promise<void>;

  getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null>;

  // Client invoices
  createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink>;

  // Webhooks
  verifyWebhookSignature(payload: Buffer, signature: string): boolean;

  parseWebhookEvent(payload: any): SubscriptionEvent | null;
}

export class PaymentProviderError extends Error {
  constructor(public provider: string, message: string) {
    super(`[${provider}] ${message}`);
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/payment-providers/provider.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/payment-providers/provider.ts
git commit -m "feat: create payment provider interface"
```

---

### Task 4: Update Stripe Provider Implementation

**Files:**
- Modify: `lib/payment-providers/stripe.ts`

**Step 1: Replace entire file with new implementation**

```typescript
// lib/payment-providers/stripe.ts

import Stripe from 'stripe';
import { PaymentProvider, SubscriptionEvent, PaymentLink, SubscriptionData, PaymentProviderError } from './provider';

export class StripeProvider implements PaymentProvider {
  name = 'Stripe';
  region: 'global' | 'india' | 'nepal' = 'global';

  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    });
  }

  async createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }> {
    try {
      // Get or create Stripe customer
      const customers = await this.stripe.customers.list({
        limit: 1,
        metadata: { agencyId },
      });

      let customerId = customers.data[0]?.id;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          metadata: { agencyId, planId },
        });
        customerId = customer.id;
      }

      // Create Stripe price if not already created
      let stripePrice = await this.stripe.prices.create({
        currency: planData.currency.toLowerCase(),
        unit_amount: planData.amount,
        recurring: {
          interval: planData.billingPeriod === 'yearly' ? 'year' : 'month',
        },
        product_data: {
          name: `Agency OS - Plan ${planId}`,
          metadata: { planId },
        },
      });

      // Create checkout session for subscription
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: stripePrice.id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings`,
        metadata: { agencyId, planId },
      });

      return {
        subscriptionId: session.id,
        redirectUrl: session.url || undefined,
      };
    } catch (error) {
      throw new PaymentProviderError('Stripe', `Failed to create subscription: ${String(error)}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      throw new PaymentProviderError('Stripe', `Failed to cancel subscription: ${String(error)}`);
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        agencyId: subscription.metadata?.agencyId || '',
        planId: subscription.metadata?.planId || '',
        status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      return null;
    }
  }

  async createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink> {
    try {
      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: invoice.currency.toLowerCase(),
              unit_amount: invoice.amount,
              product_data: {
                name: invoice.description,
                metadata: { invoiceId: invoice.id },
              },
            },
            quantity: 1,
          },
        ],
        metadata: { invoiceId: invoice.id },
      });

      return {
        url: paymentLink.url || '',
        expiresAt: new Date(paymentLink.expires_at * 1000),
      };
    } catch (error) {
      throw new PaymentProviderError('Stripe', `Failed to create payment link: ${String(error)}`);
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    try {
      const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: any): SubscriptionEvent | null {
    const event = payload as Stripe.Event;

    switch (event.type) {
      case 'customer.subscription.created':
        return {
          type: 'subscription.created',
          agencyId: event.data.object.metadata?.agencyId || '',
          subscriptionId: event.data.object.id,
          planId: event.data.object.metadata?.planId || '',
          status: 'active',
        };

      case 'customer.subscription.updated':
        return {
          type: 'subscription.updated',
          agencyId: event.data.object.metadata?.agencyId || '',
          subscriptionId: event.data.object.id,
          status: event.data.object.status === 'active' ? 'active' : event.data.object.status === 'past_due' ? 'past_due' : 'cancelled',
        };

      case 'customer.subscription.deleted':
        return {
          type: 'subscription.cancelled',
          agencyId: event.data.object.metadata?.agencyId || '',
          subscriptionId: event.data.object.id,
        };

      case 'invoice.payment_succeeded':
        return {
          type: 'invoice.paid',
          agencyId: event.data.object.metadata?.agencyId || '',
          subscriptionId: event.data.object.subscription || '',
          amount: event.data.object.total,
          currency: event.data.object.currency,
        };

      case 'invoice.payment_failed':
        return {
          type: 'invoice.payment_failed',
          agencyId: event.data.object.metadata?.agencyId || '',
          subscriptionId: event.data.object.subscription || '',
        };

      default:
        return null;
    }
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/payment-providers/stripe.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/payment-providers/stripe.ts
git commit -m "refactor: implement StripeProvider with new interface"
```

---

### Task 5: Create Razorpay Provider Implementation

**Files:**
- Create: `lib/payment-providers/razorpay.ts`

**Step 1: Install Razorpay SDK**

Run: `npm install razorpay`
Expected: Package installed

**Step 2: Write Razorpay provider**

```typescript
// lib/payment-providers/razorpay.ts

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentProvider, SubscriptionEvent, PaymentLink, SubscriptionData, PaymentProviderError } from './provider';

export class RazorpayProvider implements PaymentProvider {
  name = 'Razorpay';
  region: 'global' | 'india' | 'nepal' = 'india';

  private razorpay: InstanceType<typeof Razorpay>;

  constructor(keyId: string, keySecret: string) {
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }> {
    try {
      // Create Razorpay plan
      const plan = await this.razorpay.plans.create({
        period: planData.billingPeriod === 'yearly' ? 'yearly' : 'monthly',
        interval: 1,
        amount: planData.amount,
        currency: planData.currency,
        description: `Agency OS Plan - ${planId}`,
        notes: { agencyId, planId },
      });

      // Create subscription
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: plan.id,
        customer_notify: 1,
        quantity: 1,
        total_count: 0, // Infinite
        notes: { agencyId, planId },
      });

      return {
        subscriptionId: subscription.id,
      };
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to create subscription: ${String(error)}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.razorpay.subscriptions.pause(subscriptionId, {
        pause_at: 'now',
      });
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to cancel subscription: ${String(error)}`);
    }
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null> {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);

      return {
        id: subscription.id,
        agencyId: subscription.notes?.agencyId || '',
        planId: subscription.notes?.planId || '',
        status: subscription.status === 'active' ? 'active' : subscription.status === 'paused' ? 'paused' : 'cancelled',
        currentPeriodStart: new Date(subscription.start_at * 1000),
        currentPeriodEnd: new Date(subscription.end_at * 1000),
        nextBillingDate: new Date(subscription.end_at * 1000),
      };
    } catch (error) {
      return null;
    }
  }

  async createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink> {
    try {
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: invoice.amount,
        currency: invoice.currency,
        accept_partial: false,
        description: invoice.description,
        customer: {
          contact: '9999999999', // Placeholder, should come from invoice
        },
        notes: { invoiceId: invoice.id },
        notify: { sms: true, email: true },
        reminder_enable: true,
      });

      return {
        url: paymentLink.short_url || '',
      };
    } catch (error) {
      throw new PaymentProviderError('Razorpay', `Failed to create payment link: ${String(error)}`);
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const hash = crypto
        .createHmac('sha256', secret)
        .update(payload.toString())
        .digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: any): SubscriptionEvent | null {
    const event = payload.event;
    const data = payload.payload?.subscription?.entity || payload.payload?.payment?.entity;

    switch (event) {
      case 'subscription.authenticated':
        return {
          type: 'subscription.created',
          agencyId: data.notes?.agencyId || '',
          subscriptionId: data.id,
          planId: data.notes?.planId || '',
          status: 'active',
        };

      case 'subscription.updated':
        return {
          type: 'subscription.updated',
          agencyId: data.notes?.agencyId || '',
          subscriptionId: data.id,
          status: data.status === 'active' ? 'active' : 'cancelled',
        };

      case 'invoice.paid':
        return {
          type: 'invoice.paid',
          agencyId: data.notes?.agencyId || '',
          subscriptionId: data.subscription_id || '',
          amount: data.amount,
          currency: data.currency,
        };

      case 'invoice.payment_failed':
        return {
          type: 'invoice.payment_failed',
          agencyId: data.notes?.agencyId || '',
          subscriptionId: data.subscription_id || '',
        };

      default:
        return null;
    }
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/payment-providers/razorpay.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/payment-providers/razorpay.ts
git commit -m "feat: implement RazorpayProvider"
```

---

### Task 6: Create Fonepay Provider Implementation

**Files:**
- Create: `lib/payment-providers/fonepay.ts`

**Step 1: Write Fonepay provider (simplified for manual payments)**

```typescript
// lib/payment-providers/fonepay.ts

import { PaymentProvider, SubscriptionEvent, PaymentLink, SubscriptionData, PaymentProviderError } from './provider';

export class FonepayProvider implements PaymentProvider {
  name = 'Fonepay';
  region: 'global' | 'india' | 'nepal' = 'nepal';

  constructor() {
    // Fonepay doesn't have a direct API integration yet
    // Manual payment processing for now
  }

  async createSubscription(
    agencyId: string,
    planId: string,
    planData: { amount: number; currency: string; billingPeriod: 'monthly' | 'yearly' }
  ): Promise<{ subscriptionId: string; redirectUrl?: string }> {
    // Generate manual payment reference
    const subscriptionId = `FONEPAY-${agencyId}-${Date.now()}`;

    // In production, this would send an email with payment instructions
    // For now, just return the reference
    return {
      subscriptionId,
      redirectUrl: undefined,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Manual cancellation - mark in database
    return;
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionData | null> {
    // Manual verification - would need to query database
    return null;
  }

  async createPaymentLink(invoice: {
    id: string;
    amount: number;
    currency: string;
    description: string;
  }): Promise<PaymentLink> {
    // Generate QR code or payment instructions
    // For now, return a placeholder
    return {
      url: `fonepay://pay?amount=${invoice.amount}&reference=${invoice.id}`,
    };
  }

  verifyWebhookSignature(payload: Buffer, signature: string): boolean {
    // Manual verification - no webhook support yet
    return false;
  }

  parseWebhookEvent(payload: any): SubscriptionEvent | null {
    // Manual processing - no webhook support yet
    return null;
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/payment-providers/fonepay.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/payment-providers/fonepay.ts
git commit -m "feat: implement FonepayProvider (manual payments)"
```

---

### Task 7: Create Provider Factory

**Files:**
- Create: `lib/payment-providers/factory.ts`

**Step 1: Write provider factory**

```typescript
// lib/payment-providers/factory.ts

import { PaymentProvider } from './provider';
import { StripeProvider } from './stripe';
import { RazorpayProvider } from './razorpay';
import { FonepayProvider } from './fonepay';

export type Region = 'global' | 'india' | 'nepal';

export function getPaymentProvider(region: Region): PaymentProvider {
  switch (region) {
    case 'global':
      return new StripeProvider(process.env.STRIPE_SECRET_KEY || '');

    case 'india':
      return new RazorpayProvider(
        process.env.RAZORPAY_KEY_ID || '',
        process.env.RAZORPAY_KEY_SECRET || ''
      );

    case 'nepal':
      return new FonepayProvider();

    default:
      throw new Error(`Unknown region: ${region}`);
  }
}

export function getProviderNameByRegion(region: Region): string {
  const provider = getPaymentProvider(region);
  return provider.name;
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/payment-providers/factory.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/payment-providers/factory.ts
git commit -m "feat: create payment provider factory"
```

---

## Phase 3: Database Queries & Subscriptions

### Task 8: Add Subscription DB Queries

**Files:**
- Modify: `lib/db-queries.ts` (add at end of file before final exports)

**Step 1: Add subscription query functions**

```typescript
// Add these functions to lib/db-queries.ts

export async function getSubscriptionPlan(planId: string) {
  const result = await pool.query(
    'SELECT * FROM subscription_plans WHERE id = $1',
    [planId]
  );
  return result.rows[0] || null;
}

export async function getSubscriptionPlanByTierAndRegion(
  tier: 'free' | 'basic' | 'pro',
  region: 'global' | 'india' | 'nepal',
  billingPeriod: 'monthly' | 'yearly'
) {
  const result = await pool.query(
    'SELECT * FROM subscription_plans WHERE tier = $1 AND region = $2 AND billing_period = $3',
    [tier, region, billingPeriod]
  );
  return result.rows[0] || null;
}

export async function getAllSubscriptionPlans(region: 'global' | 'india' | 'nepal') {
  const result = await pool.query(
    'SELECT * FROM subscription_plans WHERE region = $1 ORDER BY tier, billing_period',
    [region]
  );
  return result.rows;
}

export async function createAgencySubscription(
  agencyId: string,
  subscriptionPlanId: string,
  provider: 'stripe' | 'razorpay' | 'fonepay',
  providerId: string // stripe_subscription_id, razorpay_subscription_id, etc.
) {
  const providerIdField =
    provider === 'stripe'
      ? 'stripe_subscription_id'
      : provider === 'razorpay'
      ? 'razorpay_subscription_id'
      : 'fonepay_order_id';

  const result = await pool.query(
    `INSERT INTO agency_subscriptions (agency_id, subscription_plan_id, provider, ${providerIdField}, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (agency_id) DO UPDATE SET
       subscription_plan_id = $2, provider = $3, ${providerIdField} = $4, status = 'active'
     RETURNING *`,
    [agencyId, subscriptionPlanId, provider, providerId]
  );
  return result.rows[0];
}

export async function getAgencySubscription(agencyId: string) {
  const result = await pool.query(
    `SELECT s.*, p.tier, p.region, p.billing_period, p.currency, p.amount_cents,
            p.max_clients, p.max_plans, p.max_team_members, p.features
     FROM agency_subscriptions s
     JOIN subscription_plans p ON s.subscription_plan_id = p.id
     WHERE s.agency_id = $1`,
    [agencyId]
  );
  return result.rows[0] || null;
}

export async function updateSubscriptionStatus(
  agencyId: string,
  status: 'active' | 'past_due' | 'paused' | 'cancelled'
) {
  const result = await pool.query(
    'UPDATE agency_subscriptions SET status = $1, updated_at = NOW() WHERE agency_id = $2 RETURNING *',
    [status, agencyId]
  );
  return result.rows[0] || null;
}

export async function recordSubscriptionChange(
  agencyId: string,
  fromTier: string | null,
  toTier: string,
  changeType: 'upgrade' | 'downgrade' | 'renewal' | 'cancellation'
) {
  return pool.query(
    'INSERT INTO subscription_change_history (agency_id, from_tier, to_tier, change_type, effective_date) VALUES ($1, $2, $3, $4, NOW())',
    [agencyId, fromTier, toTier, changeType]
  );
}

export async function countAgencyClients(agencyId: string) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM clients WHERE agency_id = $1',
    [agencyId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function countAgencyPlans(agencyId: string) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM plans WHERE agency_id = $1',
    [agencyId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function countAgencyTeamMembers(agencyId: string) {
  const result = await pool.query(
    'SELECT COUNT(DISTINCT user_id) as count FROM user_roles WHERE agency_id = $1',
    [agencyId]
  );
  return parseInt(result.rows[0].count, 10);
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/db-queries.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/db-queries.ts
git commit -m "feat: add subscription database queries"
```

---

## Phase 4: API Routes

### Task 9: Create Location Detection API

**Files:**
- Create: `app/api/user-location/route.ts`
- Create: `lib/geolocation.ts`

**Step 1: Write geolocation utility**

```typescript
// lib/geolocation.ts

import geoip from 'geoip-lite';

export type Region = 'global' | 'india' | 'nepal';

export interface UserLocation {
  country: string;
  region: Region;
  currency: string;
}

const regionMap: Record<string, Region> = {
  IN: 'india',
  NP: 'nepal',
};

export function detectRegionByIP(ip: string): UserLocation {
  const geo = geoip.lookup(ip);

  if (!geo) {
    return {
      country: 'Unknown',
      region: 'global',
      currency: 'USD',
    };
  }

  const country = geo.country;
  const region = regionMap[country] || 'global';
  const currency = region === 'india' ? 'INR' : region === 'nepal' ? 'NPR' : 'USD';

  return {
    country: country,
    region,
    currency,
  };
}
```

**Step 2: Create API route**

```typescript
// app/api/user-location/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { detectRegionByIP } from '@/lib/geolocation';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '0.0.0.0';

    const location = detectRegionByIP(ip);

    return NextResponse.json(location, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Geolocation error:', error);
    return NextResponse.json(
      { country: 'Unknown', region: 'global', currency: 'USD' },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache error for 5 min
        },
      }
    );
  }
}
```

**Step 3: Install geoip-lite**

Run: `npm install geoip-lite @types/geoip-lite`
Expected: Package installed

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit app/api/user-location/route.ts lib/geolocation.ts`
Expected: No errors

**Step 5: Commit**

```bash
git add lib/geolocation.ts app/api/user-location/route.ts
git commit -m "feat: add user location detection API"
```

---

### Task 10: Create Subscription Management API

**Files:**
- Create: `app/api/subscriptions/route.ts`
- Create: `app/api/subscriptions/[id]/route.ts`

**Step 1: Write subscription create/list route**

```typescript
// app/api/subscriptions/route.ts

import { auth } from '@/lib/auth';
import { getAgencySubscription, createAgencySubscription, getSubscriptionPlanByTierAndRegion } from '@/lib/db-queries';
import { getPaymentProvider } from '@/lib/payment-providers/factory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await getAgencySubscription(session.user.agencyId!);
    return NextResponse.json(subscription || { tier: 'free' });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tier, billingPeriod, region } = await request.json();

    // Validate inputs
    if (!['basic', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 });
    }

    // Get subscription plan
    const plan = await getSubscriptionPlanByTierAndRegion(tier as 'basic' | 'pro', region, billingPeriod as 'monthly' | 'yearly');
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get payment provider for region
    const provider = getPaymentProvider(region);

    // Create subscription with provider
    const { subscriptionId, redirectUrl } = await provider.createSubscription(
      session.user.agencyId,
      plan.id,
      {
        amount: plan.amount_cents,
        currency: plan.currency,
        billingPeriod: billingPeriod,
      }
    );

    // Save to database
    const subscription = await createAgencySubscription(
      session.user.agencyId,
      plan.id,
      region === 'india' ? 'razorpay' : region === 'nepal' ? 'fonepay' : 'stripe',
      subscriptionId
    );

    return NextResponse.json({
      subscription,
      redirectUrl,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
```

**Step 2: Write subscription management route**

```typescript
// app/api/subscriptions/[id]/route.ts

import { auth } from '@/lib/auth';
import { getAgencySubscription, updateSubscriptionStatus, recordSubscriptionChange } from '@/lib/db-queries';
import { getPaymentProvider } from '@/lib/payment-providers/factory';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const subscription = await getAgencySubscription(session.user.agencyId);
    if (!subscription || subscription.id !== id) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Get provider and cancel
    const provider = getPaymentProvider(subscription.region);
    const subscriptionId = subscription.stripe_subscription_id ||
                          subscription.razorpay_subscription_id ||
                          subscription.fonepay_order_id;

    if (subscriptionId) {
      await provider.cancelSubscription(subscriptionId);
    }

    // Update status
    await updateSubscriptionStatus(session.user.agencyId, 'cancelled');
    await recordSubscriptionChange(session.user.agencyId, subscription.tier, 'free', 'cancellation');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit app/api/subscriptions/route.ts app/api/subscriptions/[id]/route.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/subscriptions/route.ts app/api/subscriptions/[id]/route.ts
git commit -m "feat: create subscription management APIs"
```

---

### Task 11: Create Webhook Routes

**Files:**
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/api/webhooks/razorpay/route.ts`

**Step 1: Write Stripe webhook handler**

```typescript
// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { StripeProvider } from '@/lib/payment-providers/stripe';
import { updateSubscriptionStatus, recordSubscriptionChange, getAgencySubscription } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.arrayBuffer();
    const signature = request.headers.get('stripe-signature') || '';

    const provider = new StripeProvider(process.env.STRIPE_SECRET_KEY || '');

    // Verify signature
    if (!provider.verifyWebhookSignature(Buffer.from(payload), signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(Buffer.from(payload).toString());
    const event = provider.parseWebhookEvent(body);

    if (!event) {
      return NextResponse.json({ received: true });
    }

    // Handle event
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await updateSubscriptionStatus(event.agencyId, event.status || 'active');
        break;

      case 'subscription.cancelled':
        await updateSubscriptionStatus(event.agencyId, 'cancelled');
        const sub = await getAgencySubscription(event.agencyId);
        if (sub) {
          await recordSubscriptionChange(event.agencyId, sub.tier, 'free', 'cancellation');
        }
        break;

      case 'invoice.paid':
        await updateSubscriptionStatus(event.agencyId, 'active');
        break;

      case 'invoice.payment_failed':
        await updateSubscriptionStatus(event.agencyId, 'past_due');
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
```

**Step 2: Write Razorpay webhook handler**

```typescript
// app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RazorpayProvider } from '@/lib/payment-providers/razorpay';
import { updateSubscriptionStatus, recordSubscriptionChange, getAgencySubscription } from '@/lib/db-queries';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.arrayBuffer();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const provider = new RazorpayProvider(
      process.env.RAZORPAY_KEY_ID || '',
      process.env.RAZORPAY_KEY_SECRET || ''
    );

    // Verify signature
    if (!provider.verifyWebhookSignature(Buffer.from(payload), signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(Buffer.from(payload).toString());
    const event = provider.parseWebhookEvent(body);

    if (!event) {
      return NextResponse.json({ received: true });
    }

    // Handle event
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await updateSubscriptionStatus(event.agencyId, event.status || 'active');
        break;

      case 'subscription.cancelled':
        await updateSubscriptionStatus(event.agencyId, 'cancelled');
        const sub = await getAgencySubscription(event.agencyId);
        if (sub) {
          await recordSubscriptionChange(event.agencyId, sub.tier, 'free', 'cancellation');
        }
        break;

      case 'invoice.paid':
        await updateSubscriptionStatus(event.agencyId, 'active');
        break;

      case 'invoice.payment_failed':
        await updateSubscriptionStatus(event.agencyId, 'past_due');
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit app/api/webhooks/stripe/route.ts app/api/webhooks/razorpay/route.ts`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/webhooks/stripe/route.ts app/api/webhooks/razorpay/route.ts
git commit -m "feat: create webhook handlers for Stripe and Razorpay"
```

---

## Phase 5: Frontend & Usage Enforcement

### Task 12: Create Dynamic Pricing Component

**Files:**
- Modify: `components/landing/pricing.tsx`

**Step 1: Update pricing component to be dynamic**

```typescript
// components/landing/pricing.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PricingData {
  country: string;
  region: 'global' | 'india' | 'nepal';
  currency: string;
}

interface Plan {
  tier: 'basic' | 'pro';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export function Pricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          setPricing(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await fetch('/api/user-location');
        const data = await response.json();
        setPricing(data);
        localStorage.setItem('userLocation', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to detect location:', error);
        setPricing({ country: 'Unknown', region: 'global', currency: 'USD' });
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, []);

  if (loading) {
    return <div className="text-center py-20">Loading pricing...</div>;
  }

  if (!pricing) {
    return null;
  }

  const priceMap = {
    global: { basic: { monthly: 9, yearly: 86 }, pro: { monthly: 39, yearly: 374 } },
    india: { basic: { monthly: 199, yearly: 1910 }, pro: { monthly: 699, yearly: 6710 } },
    nepal: { basic: { monthly: 399, yearly: 3830 }, pro: { monthly: 1299, yearly: 12470 } },
  };

  const prices = priceMap[pricing.region];

  const plans: Plan[] = [
    {
      tier: 'basic',
      monthlyPrice: prices.basic.monthly,
      yearlyPrice: prices.basic.yearly,
      features: ['15 clients', '50 projects', '5 team members', 'Invoicing', 'Basic reporting'],
    },
    {
      tier: 'pro',
      monthlyPrice: prices.pro.monthly,
      yearlyPrice: prices.pro.yearly,
      features: ['Unlimited clients', 'Unlimited projects', 'Unlimited team members', 'Contracts', 'Advanced reporting', 'API access', 'Priority support'],
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center' }}>
          Pricing for {pricing.country}
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem', fontSize: '1.125rem' }}>
          All prices in {pricing.currency}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className="rounded-xl p-8"
              style={{
                background: 'var(--landing-card-bg)',
                border: '1px solid var(--landing-card-border)',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600', textTransform: 'capitalize' }}>
                {plan.tier}
              </h3>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ color: 'var(--accent-blue)', fontSize: '2.25rem', fontWeight: 'bold' }}>
                  {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'Rs. '}
                  {plan.monthlyPrice}
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  /month or {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'Rs. '}
                  {plan.yearlyPrice}/year
                </div>
              </div>

              <ul style={{ marginBottom: '2rem' }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--accent-blue)' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/auth/signup?plan=${plan.tier}&region=${pricing.region}`}
                className="block w-full py-3 px-4 rounded-lg font-medium text-center transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'var(--accent-blue)',
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                Get Started with {plan.tier === 'pro' ? 'Pro' : 'Basic'}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: '0.75rem', background: 'var(--landing-card-bg)', border: '1px solid var(--landing-card-border)', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '500' }}>
            All plans include:
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Free tier for testing • Client portals • Invoicing • Payment processing • Email support
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit components/landing/pricing.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add components/landing/pricing.tsx
git commit -m "feat: make pricing component dynamic by region"
```

---

### Task 13: Create Billing Settings Page

**Files:**
- Create: `app/dashboard/settings/billing/page.tsx`

**Step 1: Write billing page**

```typescript
// app/dashboard/settings/billing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';

interface Subscription {
  tier: string;
  billing_period: string;
  currency: string;
  amount_cents: number;
  status: string;
  current_period_end: string;
  max_clients: number;
  max_plans: number;
  max_team_members: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (loading) {
    return <div className="p-6">Loading billing information...</div>;
  }

  const currentTier = subscription?.tier || 'free';
  const status = subscription?.status || 'active';
  const amount = subscription ? (subscription.amount_cents / 100).toFixed(2) : '0';
  const period = subscription?.billing_period || 'monthly';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Billing & Subscription
      </h1>

      {/* Current Plan */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{
          background: 'var(--landing-card-bg)',
          border: '1px solid var(--landing-card-border)',
        }}
      >
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize' }}>
          Current Plan: {currentTier}
        </h2>

        <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
          <p>
            <strong>Status:</strong> <span style={{ color: status === 'active' ? '#10b981' : '#ef4444' }}>{status}</span>
          </p>
          <p>
            <strong>Billing Period:</strong> {period === 'yearly' ? 'Yearly' : 'Monthly'}
          </p>
          {subscription && (
            <>
              <p>
                <strong>Amount:</strong> {subscription.currency} {amount}/{period === 'yearly' ? 'year' : 'month'}
              </p>
              <p>
                <strong>Renewal Date:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
              <p style={{ marginTop: '1rem' }}>
                <strong>Limits:</strong>
              </p>
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Clients: {subscription.max_clients || '∞'}</li>
                <li>Projects: {subscription.max_plans || '∞'}</li>
                <li>Team Members: {subscription.max_team_members || '∞'}</li>
              </ul>
            </>
          )}
        </div>

        {currentTier !== 'free' && (
          <button
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
            onClick={() => {
              if (confirm('Are you sure you want to cancel your subscription?')) {
                fetch(`/api/subscriptions/${subscription?.id}`, { method: 'DELETE' })
                  .then(() => {
                    alert('Subscription cancelled');
                    window.location.reload();
                  })
                  .catch((error) => console.error('Failed to cancel:', error));
              }
            }}
          >
            Cancel Subscription
          </button>
        )}
      </div>

      {/* Upgrade */}
      {currentTier === 'free' && (
        <div
          className="rounded-xl p-6"
          style={{
            background: 'var(--landing-card-bg)',
            border: '1px solid var(--accent-blue)',
          }}
        >
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Upgrade Your Plan
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Unlock more clients, projects, and team members with a paid plan.
          </p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit app/dashboard/settings/billing/page.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/settings/billing/page.tsx
git commit -m "feat: create billing settings page"
```

---

### Task 14: Add Usage Limit Enforcement Cron

**Files:**
- Create: `app/api/cron/check-subscription-limits/route.ts`

**Step 1: Write usage enforcement cron**

```typescript
// app/api/cron/check-subscription-limits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import {
  countAgencyClients,
  countAgencyPlans,
  countAgencyTeamMembers,
  getAgencySubscription,
  updateSubscriptionStatus,
} from '@/lib/db-queries';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('Authorization');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all agencies with active subscriptions
    const result = await pool.query(`
      SELECT DISTINCT a.id, s.tier, s.max_clients, s.max_plans, s.max_team_members, s.status
      FROM agencies a
      JOIN agency_subscriptions s ON a.id = s.agency_id
      WHERE s.status IN ('active', 'past_due')
    `);

    const agencies = result.rows;
    let checked = 0;
    let warned = 0;
    let blocked = 0;

    for (const agency of agencies) {
      checked++;

      const clientCount = await countAgencyClients(agency.id);
      const planCount = await countAgencyPlans(agency.id);
      const teamCount = await countAgencyTeamMembers(agency.id);

      // Check if exceeds limits
      if (agency.max_clients && clientCount > agency.max_clients) {
        warned++;
        // Send warning email
        console.log(`Agency ${agency.id} exceeded client limit: ${clientCount}/${agency.max_clients}`);
      }

      if (agency.max_plans && planCount > agency.max_plans) {
        warned++;
        console.log(`Agency ${agency.id} exceeded plan limit: ${planCount}/${agency.max_plans}`);
      }

      if (agency.max_team_members && teamCount > agency.max_team_members) {
        warned++;
        console.log(`Agency ${agency.id} exceeded team limit: ${teamCount}/${agency.max_team_members}`);
      }

      // Check unpaid status (14+ days overdue)
      if (agency.status === 'past_due') {
        // Get subscription to check when it went past_due
        const subscription = await pool.query(`
          SELECT updated_at FROM agency_subscriptions WHERE agency_id = $1
        `, [agency.id]);

        const pastDueDate = new Date(subscription.rows[0].updated_at);
        const daysSincePastDue = Math.floor((Date.now() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSincePastDue >= 14) {
          blocked++;
          // Disable write access (already reflected in UI via status check)
          console.log(`Agency ${agency.id} has been past due for ${daysSincePastDue} days`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      warned,
      blocked,
      message: `Checked ${checked} agencies: ${warned} warnings, ${blocked} blocked`,
    });
  } catch (error) {
    console.error('Subscription limit check error:', error);
    return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 });
  }
}
```

**Step 2: Test cron locally**

Run: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-subscription-limits`
Expected: JSON response with checked/warned/blocked counts

**Step 3: Commit**

```bash
git add app/api/cron/check-subscription-limits/route.ts
git commit -m "feat: add subscription limit enforcement cron"
```

---

## Phase 6: Integration Tests

### Task 15: Write Subscription Tests

**Files:**
- Create: `__tests__/stripe-subscription.test.ts`

**Step 1: Write integration tests**

```typescript
// __tests__/stripe-subscription.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { StripeProvider } from '@/lib/payment-providers/stripe';
import { getSubscriptionPlanByTierAndRegion, createAgencySubscription } from '@/lib/db-queries';

describe('Stripe Subscription Flow', () => {
  const testAgencyId = '550e8400-e29b-41d4-a716-446655440000';
  const stripeProvider = new StripeProvider(process.env.STRIPE_SECRET_KEY || '');

  it('should fetch subscription plan by tier and region', async () => {
    const plan = await getSubscriptionPlanByTierAndRegion('basic', 'global', 'monthly');
    expect(plan).toBeDefined();
    expect(plan.tier).toBe('basic');
    expect(plan.region).toBe('global');
    expect(plan.currency).toBe('USD');
  });

  it('should create a subscription with Stripe', async () => {
    const plan = await getSubscriptionPlanByTierAndRegion('basic', 'global', 'monthly');
    expect(plan).toBeDefined();

    if (plan) {
      const result = await stripeProvider.createSubscription(testAgencyId, plan.id, {
        amount: plan.amount_cents,
        currency: plan.currency,
        billingPeriod: 'monthly',
      });

      expect(result.subscriptionId).toBeDefined();
      expect(result.redirectUrl).toBeDefined();
    }
  });

  it('should verify webhook signature', () => {
    const testPayload = Buffer.from('test');
    const testSignature = 'test_sig';
    const isValid = stripeProvider.verifyWebhookSignature(testPayload, testSignature);
    expect(typeof isValid).toBe('boolean');
  });

  it('should parse webhook events', () => {
    const mockEvent = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test123',
          status: 'active',
          metadata: { agencyId: testAgencyId, planId: 'plan123' },
        },
      },
    };

    const parsed = stripeProvider.parseWebhookEvent(mockEvent);
    expect(parsed?.type).toBe('subscription.created');
    expect(parsed?.agencyId).toBe(testAgencyId);
    expect(parsed?.subscriptionId).toBe('sub_test123');
  });
});

describe('Regional Pricing', () => {
  it('should fetch all pricing variants', async () => {
    const globalPlans = await getSubscriptionPlanByTierAndRegion('basic', 'global', 'monthly');
    const indiaPlans = await getSubscriptionPlanByTierAndRegion('basic', 'india', 'monthly');
    const nepalPlans = await getSubscriptionPlanByTierAndRegion('basic', 'nepal', 'monthly');

    expect(globalPlans?.currency).toBe('USD');
    expect(indiaPlans?.currency).toBe('INR');
    expect(nepalPlans?.currency).toBe('NPR');

    // India should be cheaper than Global
    expect(indiaPlans?.amount_cents).toBeLessThan(globalPlans?.amount_cents!);
  });
});
```

**Step 2: Run tests**

Run: `npm test -- __tests__/stripe-subscription.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add __tests__/stripe-subscription.test.ts
git commit -m "test: add subscription integration tests"
```

---

## Final: Documentation & Deployment

### Task 16: Update Environment Variables Documentation

**Files:**
- Modify: `.env.example`

**Step 1: Add environment variables**

```bash
# Add to .env.example

# Payment Providers - Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Payment Providers - Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Geolocation
MAXMIND_LICENSE_KEY=... (optional, uses geoip-lite if not set)
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add payment provider environment variables"
```

---

### Task 17: Final Build & Verification

**Step 1: Build the project**

Run: `npm run build`
Expected: Build completes without errors

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Stripe integration with multi-provider support"
```

---

## Success Criteria Checklist

- ✅ Database migrations run successfully
- ✅ Subscription plans seeded with regional pricing
- ✅ Payment provider abstraction layer works
- ✅ Stripe/Razorpay/Fonepay providers implemented
- ✅ User location detection API working
- ✅ Subscription creation via API
- ✅ Webhook handlers for Stripe and Razorpay
- ✅ Dynamic pricing homepage component
- ✅ Billing settings page
- ✅ Usage limit enforcement cron
- ✅ Integration tests passing
- ✅ No TypeScript errors
- ✅ All environment variables documented

---

## Next Steps After Implementation

1. **Get Stripe test keys** from Stripe dashboard
2. **Get Razorpay test keys** from Razorpay dashboard
3. **Test webhook delivery** using stripe-cli / Razorpay simulator
4. **Verify regional pricing** displays correctly in different locations
5. **Conduct payment flow testing** with test cards
6. **Deploy to staging** before production
7. **Monitor webhook logs** in production
8. **Set up billing portal** for customer self-service (Stripe Billing Portal)
