# Agency OS - Phase 1 Design Document

**Date:** March 1, 2026
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

Agency OS is a SaaS platform for marketing agencies in Nepal to manage their complete business workflow: Plans → Deliverables → Approvals → Invoices → Payments → Profit.

**MVP Timeline:** 6-10 weeks (Feature-Slice First approach)
**Target Launch:** First 20 founding agencies
**Success Metric:** Agencies collecting payments through the system

---

## 1. Product Promise & Positioning

### Core Promise
*"Run your marketing agency from one system: Plans → Deliverables → Approvals → Invoices → Payments → Profit."*

### Nepal-First Positioning
- NPR pricing
- Simple workflow (no enterprise complexity)
- Built for retainer + deliverable limits + approvals
- Supports Nepal payment flows: Bank transfer + FonePay QR

---

## 2. Architecture Overview

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) | Fast development, excellent DX |
| **Auth** | NextAuth v5 | Session-based, multi-tenant ready |
| **Database** | Neon PostgreSQL | Managed Postgres, RLS support for multi-tenant |
| **API** | Next.js API Routes + Server Actions | Collocated with frontend, fast iteration |
| **Payments** | FonePay QR + Bank Transfer | Nepal-native payment methods |
| **Email** | Resend | Transactional email, Nepal-friendly |
| **Jobs** | Vercel Crons | Built-in serverless scheduling |
| **PDFs** | pdfkit | Open source, server-side generation |
| **Styling** | Tailwind CSS + shadcn/ui | Fast UI development, professional design |
| **Hosting** | Vercel | Native Next.js support, zero-config deployment |

### Multi-Tenant Architecture

- **Isolation Strategy:** `agency_id` in JWT + PostgreSQL RLS policies
- **User Model:** Users belong to one agency, have role-based access
- **Client Model:** Clients belong to one agency
- **Security:** All queries filtered by `agency_id` at database level

### Security Essentials

- NextAuth session + JWT with `agency_id` claim
- RLS policies on every table (no cross-agency data exposure)
- FonePay webhook signature verification
- Audit logs for payments, approvals, contract signing
- Encrypted storage for payment credentials

---

## 3. Feature-Slice Buildout (Weeks 1-10)

### Week 1-2: Core Foundation
**Build:** Auth + Plans CRUD + Dashboard
**Deliverable:** Agencies can create plan templates

**What you're building:**
- Agency signup/login (NextAuth)
- Plans CRUD: Create Basic/Growth/Premium plans
- Plan items: Define deliverables per plan (4 videos/month, 2 articles, etc.)
- Basic dashboard showing overview
- Database schema: `agencies`, `users`, `plans`, `plan_items`

**Not yet:** No clients, no invoices, no payments

---

### Week 3-4: First Revenue (Bank Transfer) ⭐
**Build:** Clients + Invoices + Bank Transfer
**Deliverable:** First agencies collecting payment

**What you're building:**
- Client onboarding: Add clients to agency
- Auto-generate first invoice on client signup
- Invoice generation (PDF): Line items, due date, bank details
- Bank transfer payment: Client uploads receipt, agency marks paid
- Invoice list page (agency side)
- Email notifications: Invoice sent, invoice reminder
- Payment reconciliation: Track paid/unpaid status

**Validation:** Get first agencies through the money flow

---

### Week 5-6: Deliverables + Review Workflow
**Build:** Full collaboration platform
**Deliverable:** Agencies can track & manage client projects

**What you're building:**
- Auto-generate monthly deliverables from plan
- Deliverables status flow: Draft → In Review → Approved/Changes Requested → Done
- File uploads per deliverable (design files, videos, articles)
- Comments + revision tracking
- Client portal (web app view for clients)
- "Send for review" triggers email notification
- Client can approve or request changes
- Version history for revisions

---

### Week 7-8: FonePay QR Integration
**Build:** Native Nepal payment gateway
**Deliverable:** QR-based payments live

**What you're building:**
- FonePay QR account setup
- Generate QR code per invoice
- Embed QR in PDF invoice
- Payment verification webhook: FonePay → your system
- Auto-mark invoice paid on successful FonePay payment
- Client can pay directly from invoice page (scan QR)

**Result:** 2 payment methods = faster collection

---

### Week 9-10: Contracts + Polish
**Build:** Scope control + Professional polish
**Deliverable:** Production-ready Phase 1

**What you're building:**
- Contract upload (PDF)
- Client signature: Typed name + date capture
- Audit log: User, timestamp, IP, user agent
- Contract-plan linkage: Signed contract = scope baseline
- Scope creep alerts: Warn when deliverables exceed plan
- Dashboard metrics: MRR, overdue invoices, completion %, client risk
- UI polish, error handling, performance optimization

---

## 4. Data Model (Core Tables)

```sql
-- Multi-tenant core
agencies (id, name, owner_id, currency, created_at)
users (id, agency_id, email, role, created_at)
clients (id, agency_id, name, email, created_at)

-- Plans
plans (id, agency_id, name, price, billing_cycle, created_at)
plan_items (id, plan_id, deliverable_type, qty, recurrence)

-- Subscriptions
client_plans (id, client_id, plan_id, start_date, status)

-- Deliverables
deliverables (id, client_id, month, type, status, due_date, assigned_to)
deliverable_assets (id, deliverable_id, file_url, version, uploaded_by)
deliverable_comments (id, deliverable_id, author_id, comment)

-- Billing
invoices (id, client_id, agency_id, amount, due_date, status, pdf_url)
invoice_items (id, invoice_id, description, qty, rate, amount)

-- Payments
payments (id, invoice_id, provider, amount, status, reference_id, meta_json)

-- Contracts
contracts (id, client_id, agency_id, plan_id, status, file_url, signed_file_url)
contract_audit_log (id, contract_id, event, timestamp, ip, user_agent)
```

---

## 5. Payment Flow (FonePay QR + Bank Transfer)

### Bank Transfer (Default)
1. Invoice PDF shows bank details
2. Client uploads receipt to invoice page
3. Agency verifies receipt, marks "Paid"
4. Invoice status updates → client sees "Paid"

### FonePay QR (Week 7-8)
1. Invoice PDF includes embedded FonePay QR code
2. Client scans QR or clicks "Pay Now"
3. FonePay checkout opens
4. After payment, FonePay webhook notifies your system
5. Your system verifies + marks invoice "Paid" automatically
6. No manual work required

---

## 6. Multi-Tenant Security (RLS + Auth)

### Row-Level Security (RLS)
Every table has RLS policy:
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_agency_invoices" ON invoices
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

Result: Database enforces isolation, no accidental cross-agency data leaks.

### Authentication Flow
1. User signs up with email → NextAuth creates session
2. Session JWT includes `agency_id`
3. All API requests include JWT
4. Backend verifies `agency_id` matches request
5. Database RLS filters by `agency_id`
6. No single point of failure

---

## 7. Error Handling & Validation

### Client-Side
- Form validation before submit
- Real-time feedback (required fields, format validation)
- Error toasts for failed operations

### Server-Side
- Request validation + JWT verification
- RLS policies (database level)
- Transaction handling for payment updates
- Webhook signature verification (FonePay)

### Graceful Failures
- Invoice PDF generation fails → show error, manual retry
- Payment webhook fails → manual mark-as-paid fallback
- Email delivery fails → queued for retry

---

## 8. Testing Strategy (Phase 1)

### Manual Testing (MVP Focus)
- Auth flow (signup, login, logout)
- Plan creation + modification
- Client onboarding
- Invoice generation (PDF download)
- Bank transfer payment flow
- FonePay QR integration
- Deliverables creation + status updates
- Comments + file uploads
- Contract signing

### Automated Testing (Later)
- E2E tests with Playwright
- API integration tests
- RLS policy tests
- Payment webhook verification

---

## 9. Deployment Strategy

### Development
- `npm run dev` → http://localhost:3000
- Neon connection string in `.env.local`
- NextAuth secret in `.env.local`

### Staging (Before Launch)
- Deploy to Vercel (preview branch)
- Test FonePay integration
- Load test with 10 agencies
- UAT with early adopters

### Production (Go-Live)
- Vercel production deployment
- Neon production database
- Environment variables configured
- Error tracking (Sentry optional)
- Analytics optional (Vercel Analytics)

---

## 10. Success Criteria (Phase 1)

✅ **Feature Complete**
- All Week 1-10 features shipped
- No critical bugs

✅ **Business Validation**
- 10+ agencies onboarded
- $5,000+ MRR from Phase 1 founders
- 80%+ payment collection rate

✅ **Technical Quality**
- Zero security incidents
- <2s invoice PDF generation
- <99.9% uptime

---

## 11. Phase 1.5 (Nepal Growth - After Launch)

Once Phase 1 is live and you have early customer feedback:
- Add-ons & scope billing (bill extras beyond plan)
- eSewa ePay payment gateway
- Better dashboards (client risk scores, approval delay metrics)
- Automated reminders (email + SMS)

---

## 12. Phase 2 (India Expansion - Later)

- Razorpay integration (UPI, cards)
- INR pricing
- GST-ready invoicing
- Subscription retainers (optional)

---

## Approval Checklist

- [x] Architecture reviewed
- [x] Tech stack approved (Next.js + Neon + FonePay)
- [x] Feature phases aligned with timeline
- [x] Security model validated
- [x] Payment flow approved
- [x] Ready for implementation

**Next Step:** Execute implementation plan (Weeks 1-10)
