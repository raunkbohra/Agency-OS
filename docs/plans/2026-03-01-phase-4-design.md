# Phase 4 Design: Contracts + Scope Control + Metrics + Polish

**Date:** March 1, 2026
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

Phase 4 completes Agency OS as a production-ready platform by adding scope management (contracts), business intelligence (metrics), and operational polish. Agencies can upload contracts with digital signatures, get alerted on scope creep, track financial/operational metrics, and launch with confidence to 20 founding agencies.

**Goal:** Production-ready Agency OS with contracts, scope control, business metrics, and optimized performance.

**Timeline:** 2 weeks (Weeks 9-10, sequential feature rollout)

**Approach:** Sequential - Contracts → Scope Alerts → Metrics → Polish

---

## Phase 4 Sequential Breakdown

### Week 9, Days 1-2: Contracts System

**What you're building:**
- Contract upload (PDF) with metadata storage
- Client portal: view contract, sign with typed name + date
- Audit trail: IP, user agent, timestamp for signature
- Link contract to client plan (scope baseline)
- Dashboard: view contract status per client

**Key Tables:**
- `contracts` - PDF metadata, upload date, signer
- `contract_signatures` - Name, date, IP, user agent, timestamp

**Features:**
- Agency uploads PDF contract
- Client receives email: "Please review and sign contract"
- Client signs: types name, date auto-captured
- Audit log created (IP, user agent, timestamp)
- Signature stored as immutable record
- Contract linked to plan version (scope reference)

---

### Week 9, Days 3-4: Scope Creep Alerts

**What you're building:**
- Alert system: triggers when deliverables exceed plan by >50%
- Real-time calculation on deliverable status changes
- Email notifications to agency
- Dismissible alerts with acknowledgment
- Client risk score based on alert frequency

**Key Tables:**
- `scope_alerts` - Triggered alerts with client context
- Risk score calculated from alert history

**Features:**
- Calculate: (actual - planned) / planned > 0.5
- Example: Plan = "4 videos/month" → 7+ videos created → alert
- Email: "Alert: Client over-scoped by 75%"
- Dashboard: "Active Scope Alerts" widget showing risk count
- Risk matrix: Clients by revenue vs risk score
- Historical view: when alerts triggered, resolved

---

### Week 9-10, Days 5-8: Business Metrics Dashboard

**What you're building:**
- Unified metrics page: `/dashboard/metrics`
- Financial view: MRR, ARR, collection rate, outstanding, revenue by client
- Operational view: completion %, on-time delivery %, risk score, alerts
- Charts and visualizations
- 30/90/365 day views
- Export to CSV

**Key Metrics:**

**Financial:**
- MRR = sum of active client plan prices
- ARR = MRR × 12
- Collection Rate = (paid invoices) / (all invoices) %
- Outstanding Value = sum of unpaid invoice amounts
- Revenue by Client = breakdown showing high/low value clients
- Payment Method Mix = which providers used (FonePay %, Stripe %, etc.)

**Operational:**
- Deliverable Completion % = (done) / (total) %
- On-Time Delivery % = (delivered by due date) / (all) %
- Avg Days to Complete = avg time from draft → done
- Client Risk Score = 0-100 based on scope alert frequency
- Active Scope Alerts = count of clients > 50% threshold

**Dashboard Components:**
- Summary cards: MRR, Collection Rate, Active Alerts, Completion %
- Revenue chart: 12-month trending
- Delivery performance: completion % and on-time %
- Client breakdown: revenue by client pie chart
- Risk matrix: scatter plot (MRR vs risk score)
- Recent alerts: latest scope creeps and overdue invoices
- Export button: download all metrics as CSV

---

### Week 10, Days 9-10: Production Polish

**What you're building:**
- Performance optimization (queries, caching, pagination)
- Error handling (user messages, retry logic, transactions)
- Responsive design (mobile, tablet, desktop)
- Code quality (80%+ test coverage, security audit)
- Launch checklist validation

**Performance:**
- Database: add indexes on frequently queried columns
- Pagination: lists show 25-50 items per page
- Caching: static data cached for 1 hour
- File handling: optimize PDF/image uploads
- API targets: <500ms response time

**Error Handling:**
- User-friendly error messages (no stack traces)
- Graceful degradation (UI works if optional features fail)
- Webhook retries: 3 attempts with exponential backoff
- Database transactions: multi-step operations atomic
- Error monitoring: logs to Sentry/LogRocket

**Responsive Design:**
- Mobile-first development
- Hamburger menu on mobile
- Tables collapse to cards on phone
- No horizontal scrolling
- Forms work on all screen sizes
- Tested on iOS/Android

**Code Quality:**
- Unit tests: 80%+ coverage for business logic
- Integration tests: end-to-end workflows
- Manual QA: smoke test checklist
- Security: check for XSS, SQL injection, auth bypasses
- Load testing: 100+ concurrent users

**Launch Checklist:**
- [ ] 500+ unit tests passing
- [ ] No console errors
- [ ] Mobile testing (iOS/Android)
- [ ] Payment webhooks tested (sandbox)
- [ ] Email notifications working
- [ ] Database backups configured
- [ ] Error monitoring configured
- [ ] Rate limiting configured
- [ ] Caching strategy validated

---

## Data Model

### New Tables

```sql
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
  alert_type TEXT,  -- 'over_scope', 'trend'
  threshold_exceeded DECIMAL,  -- e.g., 0.75 for 75% over
  status TEXT DEFAULT 'active',  -- active, acknowledged, resolved
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_signed ON contracts(signed);
CREATE INDEX idx_scope_alerts_client_id ON scope_alerts(client_id);
CREATE INDEX idx_scope_alerts_status ON scope_alerts(status);
```

---

## Architecture

### Contracts Flow

```
1. Agency uploads contract PDF
   → Stored in Vercel Blob/S3
   → Metadata saved in contracts table

2. System sends email to client
   → "Contract waiting for signature"
   → Link to /portal/[clientToken]/contracts/[id]/sign

3. Client signs
   → Types name
   → Date auto-captured
   → IP + user agent captured
   → Signature saved (immutable)
   → Status marked signed

4. Agency dashboard shows
   → "Contract signed by John on March 5"
   → Signature details (IP, time)
   → Plan scope locked (reference point)
```

### Scope Creep Detection

```
1. Deliverable created/updated
   → Trigger calculation

2. Calculate scope overage
   → Get contract's plan scope
   → Count actual deliverables
   → Formula: (actual - planned) / planned

3. If > 0.5 (50% over)
   → Create scope_alert record
   → Send email to agency
   → Add to dashboard alerts

4. Agency can acknowledge
   → Mark alert acknowledged
   → System logs acknowledgment time
   → Prevents duplicate alerts
```

### Metrics Calculation

```
Financial Metrics (calculated from invoices + payments):
- MRR = SUM(active client plans price)
- ARR = MRR × 12
- Collection Rate = (paid) / (all) %
- Outstanding = SUM(unpaid invoice amounts)

Operational Metrics (calculated from deliverables):
- Completion % = (done) / (all) %
- On-Time % = (delivered ≤ due_date) / (all) %
- Avg Days = AVG(done_date - due_date)

Risk Score (based on scope alerts):
- Risk = (alert_count × weight) + (alert_frequency × weight) / 100
- Range: 0-100 (100 = highest risk)
```

---

## Pages & Components

### Contracts (Agency Side)
- `/dashboard/contracts` - List all contracts with status
- `/dashboard/contracts/[id]` - View contract, download PDF
- `/dashboard/contracts/upload` - Upload new contract

### Contracts (Client Portal)
- `/portal/[clientToken]/contracts` - View assigned contracts
- `/portal/[clientToken]/contracts/[id]/sign` - Sign contract page

### Scope Alerts
- `/dashboard/alerts` - View all active/historical alerts
- Widget on dashboard: "Active Alerts" with count and risks

### Metrics Dashboard
- `/dashboard/metrics` - Main business intelligence dashboard
- Summary cards, charts, risk matrix
- Export button for CSV download

### Polish
- Error pages: 404, 500 with helpful messages
- Loading states: spinners, skeleton screens
- Mobile navigation: hamburger menu
- Responsive tables: collapse to cards

---

## Success Metrics

- **Launch Quality:** 500+ tests passing, 0 console errors
- **Performance:** All API endpoints <500ms, page load <2s
- **Adoption:** 20 founding agencies successfully onboarded
- **Revenue Tracking:** MRR visible and accurate for all agencies
- **Scope Management:** Scope alerts prevent 10%+ of scope creep incidents
- **Mobile:** Fully usable on iOS/Android without horizontal scroll

---

## Post-Launch: Phase 4+ Ideas (Future)

Once Phase 1-4 complete, consider:

**Phase 4+A: Advanced Automation**
- Auto-email reminders: "Invoice due in 3 days"
- Auto-escalation: Mark invoice overdue after X days
- Bulk operations: Mark multiple invoices paid at once
- CSV import: Import clients, plans, invoices in bulk

**Phase 4+B: Advanced Integrations**
- Slack notifications: scope alerts, payment updates
- Google Calendar sync: due dates to calendar
- Accounting software: export to QuickBooks, FreshBooks
- Analytics: track metrics in Mixpanel, Amplitude

**Phase 4+C: Team Collaboration**
- Multiple users per agency with roles
- Approval workflows for scope changes
- Activity log: who changed what when
- Comments on deliverables/invoices

**Phase 4+D: Client Self-Service**
- Client can request changes to deliverables
- Client can download invoices/contracts
- Client can submit payment receipts
- Client performance dashboard (their deliverables only)

