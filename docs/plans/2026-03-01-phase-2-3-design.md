# Phase 2 & 3 Design: Deliverables + Multi-Provider Payments

**Date:** March 1, 2026
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

Phase 2 & 3 build the complete agency workflow: **Deliverables + Approvals** (collaboration) and **Multi-Provider Payments** (flexible payment collection). Both phases execute in parallel over 3 weeks, launching together as a complete product.

**Goal:** Agencies can track deliverables with clients, and collect payments through their choice of payment providers (bank transfer, Stripe, Razorpay, Esewa, FonePay, etc.)

**Timeline:** 3 weeks (Weeks 1-3, parallel execution)

---

## Phase 2: Deliverables & Review Workflow

### Overview

Agencies need to track what they're delivering to clients (4 videos/month, 2 articles, designs, etc.). Phase 2 automates deliverable generation from plans, enables file uploads, comments, and client approval.

**Key Features:**
- Auto-generate deliverables monthly from client's assigned plan
- Upload files per deliverable (images, PDFs, videos)
- Comments & revision tracking
- Status workflow: Draft → In Review → Approved/Changes Requested → Done
- Client portal for viewing & approving deliverables
- Email notifications (sent for review, changes requested, approved)
- Version history & audit trail

### Data Model

**New Tables:**

```sql
-- Deliverables (auto-generated monthly from plans)
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  title TEXT NOT NULL,                    -- e.g., "Video 1 of 4"
  description TEXT,
  status TEXT DEFAULT 'draft',            -- draft, in_review, approved, changes_requested, done
  month_year TEXT,                        -- "2026-03" for grouping
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Files uploaded for deliverables
CREATE TABLE deliverable_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INT,
  file_type TEXT,                         -- mime type
  file_url TEXT NOT NULL,                 -- S3 or Vercel Blob URL
  uploaded_by UUID NOT NULL REFERENCES users(id),
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments & revision requests
CREATE TABLE deliverable_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  is_revision_request BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Version history for deliverables
CREATE TABLE deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version_number INT,
  status_at_version TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverable_files_deliverable_id ON deliverable_files(deliverable_id);
```

### Architecture

**Auto-Generation (Vercel Cron):**
- Run on 1st of each month
- For each active client with assigned plan:
  - Get plan items (e.g., "4 videos/month", "2 articles")
  - Create deliverable records with status "draft"
  - Set due date based on billing cycle

**Status Workflow:**
```
Draft → In Review → Approved / Changes Requested → Done
        ↓                           ↓
      Email sent to client     Create comment + email agency
                               → Back to Draft for revisions
```

**Client Portal:**
- Read-only view of assigned deliverables
- Can download files
- Can approve or request changes
- Comment on deliverables

### Pages & Components

**Agency Side:**
- `/dashboard/deliverables` - List all deliverables (filters: client, status, month)
- `/dashboard/deliverables/[id]` - Edit, upload files, manage status, view comments
- `/dashboard/clients/[id]/deliverables` - Client's deliverables section

**Client Portal (New):**
- `/portal/[clientToken]/deliverables` - All assigned deliverables
- `/portal/[clientToken]/deliverables/[id]` - Detail, approve/request changes

**Email Notifications:**
- "Review Requested" → when status = "in_review"
- "Changes Requested" → when comment marked as revision request
- "Approved" → when status = "approved"

---

## Phase 3: Multi-Provider Payment System

### Overview

Instead of hardcoding a single payment gateway, Phase 3 builds an **abstract payment provider system** that supports multiple gateways: Bank Transfer, Stripe, Razorpay, Esewa, FonePay, etc. Agencies choose which providers to enable.

**Key Features:**
- Support multiple payment providers simultaneously
- Agencies configure credentials per provider
- Single invoice displays all enabled payment methods
- Provider-agnostic webhook router
- Encrypted credential storage
- Payment audit trail & reconciliation

### Data Model

**New Tables:**

```sql
-- Available payment providers (catalog)
CREATE TABLE payment_providers (
  id TEXT PRIMARY KEY,                    -- "stripe", "razorpay", "fonepay", "esewa"
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  requires_credentials BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agency's configured payment methods
CREATE TABLE agency_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES payment_providers(id),
  credentials JSONB NOT NULL,             -- Encrypted (merchant_id, api_key, webhook_secret)
  enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions (provider-agnostic)
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  provider_id TEXT NOT NULL,              -- Which provider processed payment
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NPR',
  status TEXT DEFAULT 'pending',          -- pending, completed, failed, cancelled
  transaction_id TEXT,                    -- Provider's transaction ID
  reference_id TEXT,                      -- Agency/client reference
  webhook_payload JSONB,                  -- Original webhook data (audit trail)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook event log
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  verified BOOLEAN,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_provider_id ON payment_transactions(provider_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_agency_payment_methods_agency_id ON agency_payment_methods(agency_id);
```

### Provider Interface (Abstract)

Each payment provider implements:

```typescript
interface PaymentProvider {
  id: string;                    // "stripe", "razorpay", "fonepay", "esewa"
  name: string;

  // Initialization
  initialize(credentials: Record<string, string>): Promise<void>;

  // Validate credentials before saving
  validateCredentials(credentials: Record<string, string>): Promise<boolean>;

  // Generate payment request
  generatePaymentRequest(invoice: Invoice): Promise<{
    qr?: string;               // QR code image/data
    link?: string;             // Payment link
    embedded?: string;         // HTML for embedding
  }>;

  // Webhook verification
  verifyWebhook(
    payload: Record<string, any>,
    signature: string
  ): Promise<boolean>;

  // Parse webhook to standard format
  parsePaymentEvent(payload: Record<string, any>): {
    invoiceId: string;
    amount: number;
    status: "completed" | "pending" | "failed";
    transactionId: string;
    timestamp: Date;
  };
}
```

### Supported Providers (Phase 3 Launch)

1. **Bank Transfer** (existing from Phase 1)
   - Manual upload of receipt
   - No webhook, manual verification

2. **FonePay**
   - QR code generation
   - Webhook verification
   - Nepal-native

3. **Stripe**
   - Payment links
   - Webhook verification
   - International support

4. **Razorpay**
   - QR code
   - Webhook verification
   - India/South Asia

5. **Esewa**
   - QR code
   - Webhook verification
   - Nepal-native

**Future (Phase 3+):** PayPal, 2Checkout, local bank integrations

### Architecture

**Invoice Payment Methods:**
When displaying invoice, show all enabled providers:

```
Available Payment Methods:
☐ Bank Transfer (always available)
☐ FonePay QR (if enabled for agency)
☐ Stripe (if enabled for agency)
☐ Razorpay (if enabled for agency)
☐ Esewa (if enabled for agency)
```

Each provider shows its own UI (QR code, link, embedded form).

**Webhook Routing:**
```
POST /api/payments/webhook
  → Extract provider_id from payload/headers
  → Route to correct provider handler
  → Verify signature with provider's credentials
  → Parse to standard format
  → Update invoice status
  → Send notification email
```

**Credential Storage:**
- Store encrypted in database
- Decrypt only when needed
- Never log credentials
- Audit trail of credential changes

### Pages & Components

**Agency Settings:**
- `/dashboard/settings/payments` - Payment methods manager
  - List available providers
  - Add credentials per provider
  - Toggle provider on/off
  - Test provider connection
  - View transaction history per provider

**Invoice Detail Page (Updated):**
- Show all enabled payment methods
- Display QR codes for providers that support them
- Show payment links for providers
- Bank transfer instructions (existing)

**Invoice PDF (Updated):**
- Include all enabled payment methods
- QR codes from each provider
- Bank transfer details

### API Endpoints

```
GET    /api/payments/providers              → List available providers
GET    /api/payments/providers/[id]         → Get provider details
POST   /api/payments/webhook                → Generic webhook handler
POST   /api/payments/[provider]/webhook     → Provider-specific webhook
GET    /api/settings/payments               → Get agency's payment methods
POST   /api/settings/payments               → Add/update payment method
DELETE /api/settings/payments/[id]          → Remove payment method
POST   /api/settings/payments/[id]/test     → Test payment provider
GET    /api/invoices/[id]/payment-methods   → Get enabled methods for invoice
```

---

## Integration Points (Week 2.5-3)

**Phase 2 ↔ Phase 3:**
- Invoice PDF includes all payment methods (both phases)
- Payment confirmation email includes deliverable status
- Dashboard shows payment completion % vs. deliverable completion %
- No tight coupling - they work independently

**Workflow Example:**
1. Client assigned plan → Deliverables auto-generated
2. Agency uploads files → Sends for review
3. Client approves → Status = "approved"
4. Invoice sent → Shows all payment methods (Bank, FonePay, Stripe, etc.)
5. Client pays via FonePay QR → Invoice marked paid
6. Agency notified of payment → Can mark deliverables "done"

---

## Database & Security

**Encryption:**
- Payment credentials encrypted at rest (AES-256)
- Decrypted only in memory when making API calls
- Never logged or displayed

**Multi-Tenant Isolation:**
- All queries filtered by `agency_id`
- Webhooks verify agency ownership before updating
- RLS policies on all payment tables

**Audit Trail:**
- All webhook events logged in `payment_webhooks`
- Full payload stored for disputes/debugging
- Signature verification logged

---

## Testing Strategy

**Phase 2 (Deliverables):**
- Unit tests: Auto-generation logic
- Integration tests: File uploads, comments
- E2E tests: Complete workflow (agency upload → client approve → email sent)

**Phase 3 (Payments):**
- Unit tests: Provider interface implementation
- Mock providers for testing
- Webhook signature verification tests
- Integration tests: End-to-end payment flow
- E2E tests: Multiple providers on same invoice

---

## Timeline

**Week 1-2: Core Implementation (Parallel)**
- Phase 2: Deliverables CRUD, file uploads, comments
- Phase 3: Provider interface, credential management, webhook router

**Week 2-2.5: Advanced Features (Parallel)**
- Phase 2: Client portal, email notifications
- Phase 3: Individual provider implementations (Stripe, Razorpay, Esewa, FonePay)

**Week 2.5-3: Integration & Polish**
- Connect Phase 2 & 3
- Invoice PDFs with all payment methods
- Dashboard updates
- Testing & bug fixes
- UI polish

**Week 3: Launch**
- Full deploy of both phases
- Release to founding 20 agencies

---

## Success Metrics

- Agencies completing deliverable workflows (upload → approve)
- Payment completion rate across all providers
- Webhook reliability (99%+ successful processing)
- Client approval time (track in analytics)
- Revenue collected (total + by provider)

