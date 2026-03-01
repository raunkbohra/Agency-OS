# Phase 2 & 3 Setup Guide

> Complete setup and configuration guide for Agency OS Phase 2 (Deliverables) and Phase 3 (Multi-Provider Payments)

## Phase 2: Deliverables System

### 1. Database Migration

Run the deliverables migration to create the required tables:

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/004_add_deliverables_tables.sql
```

This creates:
- `deliverables` - Main deliverable tracking table
- `deliverable_files` - File uploads and versions
- `deliverable_comments` - Comments and revision requests
- `deliverable_versions` - Version history tracking

### 2. Vercel Crons Configuration

#### Environment Setup

Add the `CRON_SECRET` to your `.env.local`:

```env
CRON_SECRET=your-secure-cron-secret-here
```

> **Production Note:** Change this to a strong random secret in production environments.

#### Vercel Project Configuration

1. Deploy your project to Vercel
2. In your Vercel project settings, configure the cron job:
   - **Endpoint:** `/api/cron/generate-deliverables`
   - **Schedule:** `0 0 1 * *` (1st of each month at midnight UTC)

The `vercel.json` file already contains the cron schedule configuration.

### 3. Features Enabled

Once Phase 2 setup is complete, the following features are available:

- **Agency View:** `/dashboard/deliverables`
  - View all deliverables for your agency
  - Filter by status (draft, in_review, approved, changes_requested, done)
  - Click into any deliverable to view details

- **Deliverable Detail Page:** `/dashboard/deliverables/[id]`
  - View deliverable details, files, and comments
  - Update deliverable status
  - Add comments with revision request flags
  - Download uploaded files

- **Client Portal:** `/portal/[clientToken]/deliverables`
  - Token-based access (no authentication needed)
  - Clients can view their deliverables
  - See approval status and due dates

- **Auto-Generation:** Monthly cron job
  - Automatically creates deliverables on the 1st of each month
  - Based on plan items assigned to active client plans
  - One deliverable per plan item

## Phase 3: Multi-Provider Payment System

### 1. Database Migration

Run the payment provider migration:

```bash
psql postgresql://raunakbohra@localhost/agency_os < lib/migrations/006_add_payment_provider_tables.sql
```

This creates:
- `payment_providers` - Provider configurations (bank_transfer, fonepay, stripe, razorpay, esewa)
- `agency_payment_methods` - Agency-specific payment method credentials
- `payment_transactions` - Payment transaction records and status
- `payment_webhooks` - Webhook event logging for audit trail

### 2. Payment Provider Setup

#### Bank Transfer (No Setup Required)
- Enabled by default
- Clients can upload payment receipts
- No credentials needed

#### FonePay (Nepal QR Code Payments)

1. Sign up at [FonePay](https://www.fonepay.com/)
2. Get your API credentials:
   - **Merchant ID:** Your merchant account ID
   - **API Key:** Your API authentication key
3. Add to your environment:
   ```env
   FONEPAY_WEBHOOK_SECRET=your-webhook-secret
   ```
4. Configure webhook URL in FonePay dashboard:
   - `https://yourdomain.com/api/webhooks/payments`
   - Set header: `x-provider: fonepay`

#### Stripe (International Card Payments)

1. Sign up at [Stripe](https://stripe.com/)
2. Get your API keys from the Dashboard:
   - **API Key:** Located in Developers > API Keys > Secret key
3. Add to your environment:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
4. Create webhook endpoint:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/payments`
   - Select events: `payment_link.created`, `charge.succeeded`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

#### Razorpay (India & South Asia)

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get credentials from Settings > API Keys:
   - **Key ID:** Your key identifier
   - **Key Secret:** Your secret key
3. No webhook setup needed (polling-based or handled through payments page)

#### Esewa (Nepal Digital Wallet)

1. Contact [Esewa](https://esewa.com.np/) for merchant account
2. Get your credentials:
   - **Merchant Code:** Your merchant identifier
   - **Secret:** Your authentication secret
3. No webhook setup needed (payments verified through return URL)

### 3. Agency Payment Method Configuration

Once providers are set up, configure them per agency:

1. Navigate to `/dashboard/settings/payments`
2. For each provider you want to enable:
   - Click "Configure"
   - Enter the credentials (API keys, merchant codes, etc.)
   - Click "Save"
3. Once configured, each provider shows:
   - A toggle to enable/disable
   - Configuration date
   - Status indicator

### 4. Invoice Payment Display

Once payment methods are configured:

1. Go to any invoice detail page: `/dashboard/invoices/[id]`
2. Scroll to "Available Payment Methods" section
3. Each enabled provider shows a "Pay Now" button
4. Clicking "Pay Now" takes the client to the payment provider's interface
5. After payment, webhooks update the invoice status to "paid"

## Testing

### Run All Tests

```bash
npm test
```

Expected output: **64 tests passing**

### Run Phase 2 & 3 E2E Tests Only

```bash
npm test -- __tests__/e2e-phase-2-3.test.ts
```

## Launch Checklist

Before going live with Phase 2 & 3:

- [ ] Database migrations completed successfully (`004_add_deliverables_tables.sql` and `006_add_payment_provider_tables.sql`)
- [ ] `CRON_SECRET` configured in `.env.local` and Vercel
- [ ] Vercel cron job scheduled for monthly deliverable generation (1st of month)
- [ ] All payment providers tested in test mode
- [ ] Webhook endpoints configured for Stripe/FonePay (if using these providers)
- [ ] `STRIPE_WEBHOOK_SECRET` and `FONEPAY_WEBHOOK_SECRET` configured in environment
- [ ] Client portal token field added to clients table
- [ ] Payment settings page accessible at `/dashboard/settings/payments`
- [ ] Invoice detail page shows all configured payment methods
- [ ] All 64 tests passing: `npm test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Production secrets rotated (change `CRON_SECRET`, update API keys)

## Troubleshooting

### Deliverables not generating

1. Check `CRON_SECRET` in `.env.local` matches Vercel configuration
2. Verify cron is scheduled: Check Vercel project settings > Cron Jobs
3. Check logs: Vercel dashboard > Functions > Logs

### Payment webhooks not processing

1. Verify provider API credentials are correct in payment settings
2. Check webhook secret matches provider configuration
3. Review `payment_webhooks` table for webhook records
4. Check application logs for webhook processing errors

### Invoice status not updating after payment

1. Verify payment transaction was created successfully
2. Check `payment_transactions` table for the transaction record
3. Verify webhook was received and processed (check `payment_webhooks` table)
4. Ensure invoice ID matches in payment transaction

## Production Deployment

1. **Secrets:** Rotate all secrets (`CRON_SECRET`, API keys, webhook secrets)
2. **Database:** Run migrations on production database
3. **Environment:** Set all provider secrets in production `.env`
4. **Webhooks:** Update all webhook URLs to production domain
5. **Testing:** Run full test suite before deploying
6. **Monitoring:** Set up alerts for failed webhooks or cron jobs

---

For more details on implementation, see `docs/plans/2026-03-01-phase-2-3-implementation.md`
