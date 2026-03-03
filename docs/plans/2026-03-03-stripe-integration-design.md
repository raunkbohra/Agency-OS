# Stripe Integration & Multi-Provider Billing Design

**Date:** 2026-03-03
**Status:** Approved

## Overview

Implement comprehensive Stripe integration with multi-provider support for regional payment processing and agency subscription billing. Support two payment flows: (1) client invoice payments via regional providers, and (2) recurring subscription billing for agencies using region-specific payment methods.

## Business Model

### Pricing Structure

**Free Tier:** 2 clients, 5 plans, 1 team member — $0

**Basic Tier:**
- Global: $9/month or $86/year
- India: ₹199/month or ₹1,910/year
- Nepal: Rs. 399/month or Rs. 3,830/year
- Limits: 15 clients, 50 plans, 5 team members

**Pro Tier:**
- Global: $39/month or $374/year
- India: ₹699/month or ₹6,710/year
- Nepal: Rs. 1,299/month or Rs. 12,470/year
- Limits: Unlimited clients, plans, team members

### Regional Payment Providers

| Region | Provider | Currency | Subscription | Client Invoices |
|--------|----------|----------|---------------|-----------------|
| Global | Stripe | USD | Stripe Billing | Stripe Payment Links |
| India | Razorpay | INR | Razorpay Subscriptions | Razorpay Payment Buttons |
| Nepal | Fonepay QR | NPR | Manual/Bank Transfer | Fonepay QR Codes |

**User Location Detection:** IP-based geolocation on signup (strict, no manual selection)

---

## Architecture

### Database Schema

**New Tables:**

#### `subscription_plans`
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  region TEXT NOT NULL, -- 'global', 'india', 'nepal'
  tier TEXT NOT NULL, -- 'free', 'basic', 'pro'
  billing_period TEXT NOT NULL, -- 'monthly', 'yearly'
  currency TEXT NOT NULL, -- 'USD', 'INR', 'NPR'
  amount_cents INTEGER NOT NULL, -- in cents/paisa
  stripe_price_id TEXT, -- Stripe price ID
  razorpay_plan_id TEXT, -- Razorpay plan ID
  max_clients INTEGER,
  max_plans INTEGER,
  max_team_members INTEGER,
  features JSONB, -- feature flags
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `agency_subscriptions`
```sql
CREATE TABLE agency_subscriptions (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  provider TEXT NOT NULL, -- 'stripe', 'razorpay', 'fonepay'
  status TEXT DEFAULT 'active', -- 'active', 'past_due', 'paused', 'cancelled'
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
```

#### `subscription_change_history`
```sql
CREATE TABLE subscription_change_history (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  from_tier TEXT,
  to_tier TEXT,
  change_type TEXT, -- 'upgrade', 'downgrade', 'renewal', 'cancellation'
  effective_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `payment_providers_config`
```sql
CREATE TABLE payment_providers_config (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  provider TEXT NOT NULL, -- 'stripe', 'razorpay', 'fonepay'
  region TEXT NOT NULL,
  api_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payment Flows

#### Flow 1: Agency Subscription (Recurring)

**Signup:**
1. User signs up → IP geolocation detects region
2. Auto-assigned Free tier (no payment method required initially)
3. Show appropriate provider based on region

**Upgrade to Paid:**
1. Agency selects tier + billing period (monthly/yearly)
2. Redirect to provider's checkout:
   - Stripe: Stripe Checkout hosted page
   - Razorpay: Razorpay Checkout modal
   - Fonepay: Manual payment instruction + email
3. Provider creates subscription, returns subscription ID
4. Webhook confirms → `agency_subscriptions` record created with status `active`

**Renewal:**
- Automatic charge on next billing date (Stripe/Razorpay handle this)
- Webhook: `customer.subscription.updated` / `invoice.payment_succeeded`
- Update `current_period_end` in `agency_subscriptions`

**Payment Failure:**
- Webhook: `invoice.payment_failed` or equivalent
- Email agency to update payment method
- After 14 days unpaid: set status to `past_due`, disable write features
- After 30 days: status `cancelled`, read-only access

**Downgrade/Upgrade:**
- Agency changes tier → new subscription created
- Old subscription cancelled, prorated credit issued (Stripe/Razorpay)
- New `agency_subscriptions` record created with new plan

**Cancellation:**
- Agency requests cancellation → set `cancel_at_period_end = true`
- Continue access until end of current billing period
- On renewal date: status `cancelled`, downgrade to Free tier

---

#### Flow 2: Client Invoice Payments (One-Time)

**Existing Flow (Enhanced):**
1. Agency creates invoice → eligible for payment based on tier
2. Agency sends payment link to client via email
3. Client clicks link → regional payment provider checkout
4. Payment confirmed → Webhook updates `payments.status = 'completed'`
5. Invoice marked paid, agency notified

**Payment Link Generation:**
- Stripe: Use Payment Links API
- Razorpay: Use Payment Button/Link API
- Fonepay: Generate static QR code (manual verification)

---

### Provider Abstraction Layer

**File: `lib/payment-providers/provider.ts`** (interface)
```typescript
export interface PaymentProvider {
  name: string;
  region: string;

  // Subscriptions
  createSubscription(agencyId: string, planId: string): Promise<{ subscriptionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  updateSubscription(subscriptionId: string, newPlanId: string): Promise<void>;

  // Invoices
  createPaymentLink(invoice: Invoice): Promise<{ url: string }>;

  // Webhooks
  verifyWebhook(payload: any, signature: string): boolean;
  parseWebhookEvent(payload: any): WebhookEvent;
}
```

**Implementations:**
- `StripeProvider` (update existing)
- `RazorpayProvider` (new)
- `FonepayProvider` (new)

**Factory:** `lib/payment-providers/index.ts` — select provider by region

---

### API Routes

**Subscription Management:**
- `POST /api/subscriptions/create` — start subscription
- `POST /api/subscriptions/[id]/cancel` — cancel subscription
- `POST /api/subscriptions/[id]/upgrade` — upgrade tier
- `PATCH /api/subscriptions/[id]` — update subscription

**Billing Portal:**
- `GET /api/billing/portal` — Stripe customer portal link (Global only)
- `GET /api/billing/invoices` — list agency's invoices

**Location Detection:**
- `GET /api/user-location` — return `{ country, region, currency }` based on IP

**Webhooks:**
- `POST /api/webhooks/stripe` — Stripe events
- `POST /api/webhooks/razorpay` — Razorpay events
- `POST /api/webhooks/fonepay` — Fonepay events

---

### Usage Enforcement

**Tier Limit Checks (Daily Cron):**
- Count active clients per agency
- Count active plans per agency
- Count team members per agency
- Compare against `agency_subscriptions` tier limits

**Actions:**
- If within limits: no action
- If slightly over (< 10%): send warning email, suggest upgrade
- If significantly over (> 10%): disable "create" operations, show upgrade banner in UI

**Unpaid Enforcement:**
- Check `agency_subscriptions.status = 'past_due'` or `cancelled`
- Disable write operations (create/edit/delete)
- Show banner: "Payment overdue. Upgrade to restore access."

---

### Homepage Pricing Component

**File: `components/landing/pricing.tsx`** (updated to be dynamic)

**Detection & Display:**
1. Client-side: Call `GET /api/user-location` on mount
2. Render pricing table with region-specific data:
   - Currency (USD/INR/NPR)
   - Regional prices
   - Provider logo + name
   - CTA button with provider name: "Subscribe with Stripe" / "Subscribe with Razorpay" / "Subscribe with Fonepay"

**Caching:**
- Cache location API response for 1 hour (localStorage)
- Avoid repeated IP lookups

---

## Implementation Approach

### Phase 1: Database & Admin Setup
- Create new tables (subscription_plans, agency_subscriptions, subscription_change_history)
- Seed `subscription_plans` with all 18 price variants (3 tiers × 3 regions × 2 billing periods)
- Set up environment variables for provider API keys

### Phase 2: Provider Abstraction & Stripe
- Create payment provider interface
- Update existing StripeProvider implementation
- Implement global subscription flow (Stripe)
- Add Stripe webhook handling

### Phase 3: Razorpay Implementation
- Implement RazorpayProvider
- Add Razorpay webhook handling
- Test with Razorpay test keys

### Phase 4: Fonepay & Location Detection
- Implement FonepayProvider (simplified for manual payments)
- Add `GET /api/user-location` endpoint with IP geolocation
- Test regional detection

### Phase 5: Frontend & Enforcement
- Update billing settings page to show subscription status
- Add tier upgrade/downgrade UI
- Implement usage limit checks (cron job)
- Update pricing homepage component to be dynamic

### Phase 6: Testing & Migration
- Create test suite for all providers
- Manual testing with each provider's test keys
- Deploy to staging, then production

---

## Technical Stack

- **Stripe SDK:** `stripe` npm package
- **Razorpay SDK:** `razorpay` npm package
- **IP Geolocation:** `maxmind-geolite2` or `geoip-lite` npm package
- **Environment:** Existing Next.js setup, PostgreSQL

---

## Environment Variables

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Fonepay (if available)
FONEPAY_MERCHANT_ID=...
FONEPAY_API_KEY=...

# IP Geolocation
MAXMIND_LICENSE_KEY=... (or use free geoip-lite)
```

---

## Success Criteria

1. ✅ Agencies can upgrade from Free to Basic/Pro
2. ✅ Subscriptions renew automatically on billing date
3. ✅ Webhooks handle all payment events (success, failure, cancellation)
4. ✅ Usage limits enforced (can't create beyond tier limit)
5. ✅ Pricing homepage shows correct regional pricing dynamically
6. ✅ Support all three payment providers (Stripe/Razorpay/Fonepay)
7. ✅ Client invoices can be paid via regional providers
8. ✅ No regional pricing exploitation (IP-locked, strict detection)
