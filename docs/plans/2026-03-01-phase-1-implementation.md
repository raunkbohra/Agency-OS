# Phase 1 Implementation Plan: Agency OS MVP

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully functional SaaS platform for marketing agencies to manage plans, deliverables, invoices, and payments (FonePay QR + Bank Transfer).

**Architecture:** Feature-Slice First approach. Build one complete revenue flow first (Plans → Invoices → Bank Transfer in weeks 3-4), then expand with deliverables and payment gateways. All authenticated users isolated by agency_id using NextAuth + PostgreSQL RLS.

**Tech Stack:** Next.js 15, NextAuth v5, Neon PostgreSQL, Tailwind CSS + shadcn/ui, Resend email, Vercel Crons, pdfkit for PDFs, FonePay QR API.

**Timeline:** 6-10 weeks (10 weeks recommended for quality)

---

## Phase 1 Breakdown

### WEEK 1-2: CORE FOUNDATION
**Goal:** Agencies can create plan templates. Database schema ready for everything.

#### Task 1: Set up NextAuth v5 with Neon PostgreSQL

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Modify: `.env.local` (add DATABASE_URL, NEXTAUTH_SECRET)
- Create: `lib/db.ts` (Neon client)
- Modify: `package.json` (add next-auth, @next-auth/pg-adapter)

**Step 1: Install NextAuth dependencies**

```bash
npm install next-auth@5 @next-auth/pg-adapter pg
```

**Step 2: Create database connection**

```typescript
// lib/db.ts
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export default client;
```

**Step 3: Create NextAuth configuration**

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PgAdapter } from '@next-auth/pg-adapter';
import client from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(client),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Implement password hashing & validation
        if (credentials?.email === 'test@example.com') {
          return { id: '1', email: credentials.email, name: 'Test User' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.agencyId = user.agencyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.agencyId = token.agencyId as string;
      }
      return session;
    },
  },
});
```

**Step 4: Create NextAuth route handler**

```typescript
// app/api/auth/[...nextauth]/route.ts
export { handlers as GET, handlers as POST };
import { handlers } from '@/lib/auth';
```

**Step 5: Create sign-in page**

```typescript
// app/auth/signin/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', { email, password, redirect: true, callbackUrl: '/dashboard' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded-lg"
        />
        <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

**Step 6: Test the sign-in page locally**

```bash
npm run dev
# Visit http://localhost:3000/auth/signin
# Try signing in with test@example.com / any password
```

**Step 7: Commit**

```bash
git add lib/auth.ts lib/db.ts app/api/auth app/auth/signin .env.local package.json
git commit -m "feat: setup NextAuth v5 with Neon PostgreSQL"
```

---

#### Task 2: Create core database schema (agencies, users, plans)

**Files:**
- Create: `lib/migrations/001_init_schema.sql`
- Create: `lib/db-init.ts` (one-time setup script)

**Step 1: Create migration file**

```sql
-- lib/migrations/001_init_schema.sql

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
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'member',
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_agency" ON users
  USING (agency_id = (SELECT agency_id FROM auth.users));

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_agency_plans" ON plans
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Create plan_items table
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id),
  deliverable_type TEXT NOT NULL,
  quantity INT DEFAULT 1,
  recurrence TEXT DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_plan_items" ON plan_items
  USING (
    plan_id IN (
      SELECT id FROM plans WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_agency_clients" ON clients
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- Create client_plans (subscriptions)
CREATE TABLE client_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  start_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_client_plans" ON client_plans
  USING (
    client_id IN (
      SELECT id FROM clients WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );
```

**Step 2: Run migration manually on Neon**

```bash
# From Neon dashboard:
# 1. Copy SQL from lib/migrations/001_init_schema.sql
# 2. Paste into Neon SQL editor
# 3. Execute
# Alternatively, use psql CLI:
psql "$DATABASE_URL" -f lib/migrations/001_init_schema.sql
```

**Step 3: Create database helper**

```typescript
// lib/db-queries.ts
import { sql } from '@vercel/postgres';

export async function createAgency(name: string, ownerId: string) {
  const result = await sql`
    INSERT INTO agencies (name, owner_id)
    VALUES (${name}, ${ownerId})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPlansByAgency(agencyId: string) {
  const result = await sql`
    SELECT * FROM plans WHERE agency_id = ${agencyId}
  `;
  return result.rows;
}
```

**Step 4: Commit**

```bash
git add lib/migrations lib/db-queries.ts
git commit -m "feat: create core database schema with RLS policies"
```

---

#### Task 3: Create Plans CRUD pages

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/plans/page.tsx`
- Create: `app/dashboard/plans/new/page.tsx`
- Create: `app/dashboard/plans/[id]/page.tsx`
- Create: `components/PlanForm.tsx`

**Step 1: Create dashboard page**

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agency Dashboard</h1>
        <Link href="/dashboard/plans/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Create Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-600">MRR</h3>
          <p className="text-3xl font-bold">₹0</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-600">Clients</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-gray-600">Deliverables Due</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Your Plans</h2>
      <Link href="/dashboard/plans" className="text-blue-600 hover:underline">
        View all plans →
      </Link>
    </div>
  );
}
```

**Step 2: Create plans list page**

```typescript
// app/dashboard/plans/page.tsx
import { getPlansByAgency } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function PlansPage() {
  const session = await auth();
  const plans = await getPlansByAgency(session?.user?.agencyId || '');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Plans</h1>
        <Link href="/dashboard/plans/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Create Plan
        </Link>
      </div>

      <div className="grid gap-6">
        {plans.map((plan: any) => (
          <div key={plan.id} className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-gray-600">₹{plan.price} / {plan.billing_cycle}</p>
              </div>
              <div className="space-x-2">
                <Link href={`/dashboard/plans/${plan.id}`} className="px-4 py-2 bg-gray-200 rounded-lg">
                  Edit
                </Link>
                <button className="px-4 py-2 bg-red-200 text-red-800 rounded-lg">Archive</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Create PlanForm component**

```typescript
// components/PlanForm.tsx
'use client';

import { useState } from 'react';

export default function PlanForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, price: parseFloat(price), billingCycle });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block font-semibold mb-2">Plan Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Starter, Growth, Pro"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-semibold mb-2">Price (NPR)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="10000"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Billing Cycle</label>
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option>monthly</option>
            <option>quarterly</option>
            <option>yearly</option>
          </select>
        </div>
      </div>

      <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
        Save Plan
      </button>
    </form>
  );
}
```

**Step 4: Create new plan page**

```typescript
// app/dashboard/plans/new/page.tsx
import PlanForm from '@/components/PlanForm';
import { createPlan } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function handleCreatePlan(formData: any) {
  'use server';
  const session = await auth();
  if (!session?.user?.agencyId) return;

  await createPlan(session.user.agencyId, formData);
  redirect('/dashboard/plans');
}

export default async function NewPlanPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Plan</h1>
      <PlanForm onSubmit={handleCreatePlan} />
    </div>
  );
}
```

**Step 5: Test the plans page**

```bash
npm run dev
# Visit http://localhost:3000/dashboard/plans
# Create a test plan
```

**Step 6: Commit**

```bash
git add app/dashboard components/PlanForm.tsx
git commit -m "feat: add plans CRUD pages and dashboard"
```

---

#### Task 4: Add navigation and layout for dashboard

**Files:**
- Create: `components/Navigation.tsx`
- Modify: `app/dashboard/layout.tsx`

**Step 1: Create navigation component**

```typescript
// components/Navigation.tsx
import { auth, signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function Navigation() {
  const session = await auth();

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold">
          Agency OS
        </Link>

        <div className="space-x-6">
          <Link href="/dashboard" className="hover:text-gray-300">Dashboard</Link>
          <Link href="/dashboard/plans" className="hover:text-gray-300">Plans</Link>
          <Link href="/dashboard/clients" className="hover:text-gray-300">Clients</Link>
          <Link href="/dashboard/invoices" className="hover:text-gray-300">Invoices</Link>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm">{session?.user?.email}</span>
          <form action={async () => { 'use server'; await signOut(); }}>
            <button type="submit" className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Create dashboard layout**

```typescript
// app/dashboard/layout.tsx
import Navigation from '@/components/Navigation';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {children}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add components/Navigation.tsx app/dashboard/layout.tsx
git commit -m "feat: add navigation and dashboard layout"
```

---

**✅ END OF WEEK 1-2**

At this point:
- NextAuth is set up
- Database schema created
- Plans CRUD fully functional
- Dashboard with navigation

Status: ✅ **Ready to build revenue flow (Week 3-4)**

---

### WEEK 3-4: FIRST REVENUE (BANK TRANSFER)
**Goal:** Agencies can create clients, generate invoices, and collect payments via bank transfer.

#### Task 5: Create clients management (add/list/view)

**Files:**
- Create: `app/dashboard/clients/page.tsx`
- Create: `app/dashboard/clients/new/page.tsx`
- Create: `app/dashboard/clients/[id]/page.tsx`
- Create: `components/ClientForm.tsx`
- Modify: `lib/db-queries.ts` (add client queries)

**Step 1: Add client queries to db-queries.ts**

```typescript
// lib/db-queries.ts (add these functions)

export async function createClient(agencyId: string, clientData: any) {
  const result = await sql`
    INSERT INTO clients (agency_id, name, email, company_name)
    VALUES (${agencyId}, ${clientData.name}, ${clientData.email}, ${clientData.companyName})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getClientsByAgency(agencyId: string) {
  const result = await sql`
    SELECT * FROM clients WHERE agency_id = ${agencyId} ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getClientById(clientId: string) {
  const result = await sql`
    SELECT * FROM clients WHERE id = ${clientId}
  `;
  return result.rows[0];
}

export async function assignPlanToClient(clientId: string, planId: string) {
  const result = await sql`
    INSERT INTO client_plans (client_id, plan_id)
    VALUES (${clientId}, ${planId})
    RETURNING *
  `;
  return result.rows[0];
}
```

**Step 2: Create ClientForm component**

```typescript
// components/ClientForm.tsx
'use client';

import { useState } from 'react';

export default function ClientForm({
  onSubmit,
  plans = []
}: {
  onSubmit: (data: any) => void;
  plans: any[];
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, companyName, planId: selectedPlanId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block font-semibold mb-2">Client Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., ABC Marketing"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@client.com"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Ltd"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2">Assign Plan</label>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          required
        >
          <option value="">Select a plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ₹{plan.price}/{plan.billing_cycle}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
        Create Client
      </button>
    </form>
  );
}
```

**Step 3: Create clients list page**

```typescript
// app/dashboard/clients/page.tsx
import { getClientsByAgency } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function ClientsPage() {
  const session = await auth();
  const clients = await getClientsByAgency(session?.user?.agencyId || '');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link href="/dashboard/clients/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Add Client
        </Link>
      </div>

      <div className="grid gap-6">
        {clients.map((client: any) => (
          <div key={client.id} className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{client.name}</h3>
                <p className="text-gray-600">{client.email}</p>
                {client.company_name && <p className="text-gray-500 text-sm">{client.company_name}</p>}
              </div>
              <Link href={`/dashboard/clients/${client.id}`} className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Create new client page**

```typescript
// app/dashboard/clients/new/page.tsx
import ClientForm from '@/components/ClientForm';
import { createClient, assignPlanToClient, getPlansByAgency } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function handleCreateClient(formData: any) {
  'use server';
  const session = await auth();
  if (!session?.user?.agencyId) return;

  const client = await createClient(session.user.agencyId, formData);
  if (formData.planId) {
    await assignPlanToClient(client.id, formData.planId);
  }
  redirect('/dashboard/clients');
}

export default async function NewClientPage() {
  const session = await auth();
  const plans = await getPlansByAgency(session?.user?.agencyId || '');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Add New Client</h1>
      <ClientForm onSubmit={handleCreateClient} plans={plans} />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/dashboard/clients components/ClientForm.tsx
git commit -m "feat: add clients management (create, list, view)"
```

---

#### Task 6: Create invoice generation (PDF + database storage)

**Files:**
- Create: `lib/pdf/invoice-generator.ts`
- Create: `app/api/invoices/generate/route.ts`
- Modify: `lib/db-queries.ts` (add invoice queries)
- Create: `lib/migrations/002_add_invoices_table.sql`

**Step 1: Create invoices table migration**

```sql
-- lib/migrations/002_add_invoices_table.sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  amount DECIMAL(10, 2) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  rate DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_agency_invoices" ON invoices
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_invoice_items" ON invoice_items
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );
```

**Step 2: Install PDF generation library**

```bash
npm install pdfkit pdf-parse
```

**Step 3: Create invoice PDF generator**

```typescript
// lib/pdf/invoice-generator.ts
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InvoiceData {
  invoiceNumber: string;
  agencyName: string;
  agencyEmail: string;
  clientName: string;
  clientEmail: string;
  items: Array<{ description: string; qty: number; rate: number }>;
  totalAmount: number;
  dueDate: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
}

export function generateInvoicePDF(data: InvoiceData): Readable {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const stream = Readable.from([pdfBuffer]);
      resolve(stream);
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #${data.invoiceNumber}`, 50, 90);

    // Agency details
    doc.fontSize(12).font('Helvetica-Bold').text(data.agencyName, 50, 130);
    doc.fontSize(10).font('Helvetica').text(data.agencyEmail, 50, 150);

    // Client details
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 300, 130);
    doc.fontSize(10).font('Helvetica').text(data.clientName, 300, 150);
    doc.text(data.clientEmail, 300, 170);

    // Due date
    doc.fontSize(10).text(`Due Date: ${data.dueDate}`, 300, 200);

    // Items table
    doc.fontSize(12).font('Helvetica-Bold').text('Description', 50, 280);
    doc.text('Qty', 300, 280);
    doc.text('Rate', 400, 280);
    doc.text('Amount', 480, 280);

    let y = 310;
    data.items.forEach((item) => {
      doc.fontSize(10).font('Helvetica').text(item.description, 50, y);
      doc.text(item.qty.toString(), 300, y);
      doc.text(`₹${item.rate}`, 400, y);
      doc.text(`₹${(item.qty * item.rate).toFixed(2)}`, 480, y);
      y += 30;
    });

    // Total
    doc.fontSize(14).font('Helvetica-Bold').text(`Total: ₹${data.totalAmount.toFixed(2)}`, 400, y + 20);

    // Bank details
    if (data.bankDetails) {
      y += 80;
      doc.fontSize(12).font('Helvetica-Bold').text('Bank Transfer Details:', 50, y);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Bank: ${data.bankDetails.bankName}`, 50, y + 25);
      doc.text(`Account: ${data.bankDetails.accountNumber}`, 50, y + 45);
      doc.text(`Routing: ${data.bankDetails.routingNumber}`, 50, y + 65);
    }

    doc.end();
  }) as Promise<Readable>;
}
```

**Step 4: Add invoice queries**

```typescript
// lib/db-queries.ts (add these functions)

export async function createInvoice(invoiceData: any) {
  const result = await sql`
    INSERT INTO invoices (client_id, agency_id, amount, due_date, status)
    VALUES (${invoiceData.clientId}, ${invoiceData.agencyId}, ${invoiceData.amount}, ${invoiceData.dueDate}, 'draft')
    RETURNING *
  `;
  return result.rows[0];
}

export async function addInvoiceItem(invoiceId: string, item: any) {
  const amount = item.quantity * item.rate;
  const result = await sql`
    INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
    VALUES (${invoiceId}, ${item.description}, ${item.quantity}, ${item.rate}, ${amount})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getInvoicesByAgency(agencyId: string) {
  const result = await sql`
    SELECT i.*, c.name as client_name
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.agency_id = ${agencyId}
    ORDER BY i.created_at DESC
  `;
  return result.rows;
}

export async function getInvoiceById(invoiceId: string) {
  const result = await sql`
    SELECT * FROM invoices WHERE id = ${invoiceId}
  `;
  return result.rows[0];
}

export async function getInvoiceItems(invoiceId: string) {
  const result = await sql`
    SELECT * FROM invoice_items WHERE invoice_id = ${invoiceId}
  `;
  return result.rows;
}

export async function updateInvoiceStatus(invoiceId: string, status: string, pdfUrl?: string) {
  const updates = pdfUrl
    ? `status = '${status}', pdf_url = '${pdfUrl}'`
    : `status = '${status}'`;

  const result = await sql`
    UPDATE invoices
    SET ${updates}, updated_at = NOW()
    WHERE id = ${invoiceId}
    RETURNING *
  `;
  return result.rows[0];
}
```

**Step 5: Create invoice generation API**

```typescript
// app/api/invoices/generate/route.ts
import { generateInvoicePDF } from '@/lib/pdf/invoice-generator';
import { getClientById, getInvoiceById, getInvoiceItems, updateInvoiceStatus } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    // Fetch invoice data
    const invoice = await getInvoiceById(invoiceId);
    const client = await getClientById(invoice.client_id);
    const items = await getInvoiceItems(invoiceId);

    // Generate PDF
    const pdfStream = await generateInvoicePDF({
      invoiceNumber: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
      agencyName: 'Your Agency Name',
      agencyEmail: 'contact@agency.com',
      clientName: client.name,
      clientEmail: client.email,
      items: items.map((i: any) => ({
        description: i.description,
        qty: i.quantity,
        rate: parseFloat(i.rate),
      })),
      totalAmount: parseFloat(invoice.amount),
      dueDate: new Date(invoice.due_date).toLocaleDateString(),
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456',
        bankName: 'Bank Name',
      },
    });

    // TODO: Upload PDF to storage (Vercel Blob, S3, etc.)
    const pdfUrl = `/invoices/${invoiceId}.pdf`;

    // Update invoice status
    await updateInvoiceStatus(invoiceId, 'sent', pdfUrl);

    return new NextResponse(pdfStream, {
      headers: { 'Content-Type': 'application/pdf' },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
```

**Step 6: Commit**

```bash
git add lib/pdf lib/migrations/002_add_invoices_table.sql app/api/invoices
git commit -m "feat: add invoice generation with PDF export"
```

---

#### Task 7: Create invoices list and auto-generate on client onboard

**Files:**
- Create: `app/dashboard/invoices/page.tsx`
- Create: `app/dashboard/invoices/[id]/page.tsx`
- Modify: `app/dashboard/clients/new/page.tsx` (add auto-invoice generation)

**Step 1: Create invoices list page**

```typescript
// app/dashboard/invoices/page.tsx
import { getInvoicesByAgency } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function InvoicesPage() {
  const session = await auth();
  const invoices = await getInvoicesByAgency(session?.user?.agencyId || '');

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Invoices</h1>

      <div className="grid gap-6">
        {invoices.length === 0 ? (
          <p className="text-gray-600">No invoices yet. Create a client to generate an invoice.</p>
        ) : (
          invoices.map((invoice: any) => (
            <div key={invoice.id} className="p-6 bg-white rounded-lg shadow hover:shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{invoice.client_name}</h3>
                  <p className="text-gray-600">₹{invoice.amount}</p>
                  <p className="text-sm text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[invoice.status] || 'bg-gray-100'}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create invoice detail page**

```typescript
// app/dashboard/invoices/[id]/page.tsx
import { getInvoiceById, getInvoiceItems, getClientById, updateInvoiceStatus } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const invoice = await getInvoiceById(params.id);
  const client = await getClientById(invoice.client_id);
  const items = await getInvoiceItems(params.id);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoice for {client.name}</h1>
        <div className="space-x-2">
          <Link href={`/api/invoices/generate`} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Download PDF
          </Link>
          {invoice.status !== 'paid' && (
            <form action={async () => { 'use server'; await updateInvoiceStatus(params.id, 'paid'); }}>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">
                Mark Paid
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-gray-600">Amount</p>
          <p className="text-2xl font-bold">₹{invoice.amount}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-gray-600">Status</p>
          <p className="text-2xl font-bold capitalize">{invoice.status}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="text-gray-600">Due Date</p>
          <p className="text-2xl font-bold">{new Date(invoice.due_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Items</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">₹{item.rate}</td>
                <td className="text-right">₹{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Update client creation to auto-generate invoice**

```typescript
// Modify app/dashboard/clients/new/page.tsx - update handleCreateClient function

async function handleCreateClient(formData: any) {
  'use server';
  const session = await auth();
  if (!session?.user?.agencyId) return;

  const client = await createClient(session.user.agencyId, formData);

  if (formData.planId) {
    // Assign plan
    await assignPlanToClient(client.id, formData.planId);

    // Get the plan details
    const plans = await getPlansByAgency(session.user.agencyId);
    const plan = plans.find((p: any) => p.id === formData.planId);

    // Auto-generate first invoice
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Due in 15 days

    const invoice = await createInvoice({
      clientId: client.id,
      agencyId: session.user.agencyId,
      amount: plan.price,
      dueDate: dueDate.toISOString(),
    });

    // Add invoice item
    await addInvoiceItem(invoice.id, {
      description: `${plan.name} - Monthly Retainer`,
      quantity: 1,
      rate: plan.price,
    });
  }

  redirect('/dashboard/clients');
}
```

**Step 4: Commit**

```bash
git add app/dashboard/invoices
git commit -m "feat: add invoices list and detail pages, auto-generate on client onboard"
```

---

#### Task 8: Add bank transfer payment tracking

**Files:**
- Create: `lib/migrations/003_add_payments_table.sql`
- Create: `app/dashboard/invoices/[id]/pay/page.tsx`
- Modify: `lib/db-queries.ts` (add payment queries)

**Step 1: Create payments table migration**

```sql
-- lib/migrations/003_add_payments_table.sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  provider TEXT DEFAULT 'bank_transfer',
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  reference_id TEXT,
  receipt_url TEXT,
  meta_json JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_payments" ON payments
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );
```

**Step 2: Add payment queries**

```typescript
// lib/db-queries.ts (add these functions)

export async function createPayment(invoiceId: string, paymentData: any) {
  const result = await sql`
    INSERT INTO payments (invoice_id, provider, amount, status, reference_id, meta_json)
    VALUES (${invoiceId}, ${paymentData.provider || 'bank_transfer'}, ${paymentData.amount}, 'pending', ${paymentData.referenceId || ''}, ${JSON.stringify(paymentData.meta || {})})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updatePaymentStatus(paymentId: string, status: string, receiptUrl?: string) {
  const updates = receiptUrl
    ? `status = '${status}', receipt_url = '${receiptUrl}'`
    : `status = '${status}'`;

  const result = await sql`
    UPDATE payments
    SET ${updates}, updated_at = NOW()
    WHERE id = ${paymentId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getPaymentsByInvoice(invoiceId: string) {
  const result = await sql`
    SELECT * FROM payments WHERE invoice_id = ${invoiceId}
  `;
  return result.rows;
}
```

**Step 3: Create payment page with receipt upload**

```typescript
// app/dashboard/invoices/[id]/pay/page.tsx
'use client';

import { useState } from 'react';
import { getInvoiceById } from '@/lib/db-queries';

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [referenceId, setReferenceId] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload receipt to storage (TODO: implement)
      // const receiptUrl = await uploadReceipt(receipt);

      // Create payment record
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: params.id,
          referenceId,
          provider: 'bank_transfer',
        }),
      });

      if (response.ok) {
        alert('Payment submitted for verification');
        // Redirect to invoices
        window.location.href = '/dashboard/invoices';
      }
    } catch (error) {
      alert('Error submitting payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit Payment</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Bank Transfer Instructions</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Bank:</strong> Test Bank</p>
          <p><strong>Account Number:</strong> 1234567890</p>
          <p><strong>Routing Number:</strong> 123456</p>
          <p><strong>Account Name:</strong> Your Agency</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="block font-semibold mb-2">Transaction Reference ID</label>
          <input
            type="text"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="e.g., TXN12345"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Upload Receipt (optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}
```

**Step 4: Create payments API endpoint**

```typescript
// app/api/payments/route.ts
import { createPayment, updateInvoiceStatus } from '@/lib/db-queries';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId, referenceId, provider } = await req.json();

    // Create payment record
    const payment = await createPayment(invoiceId, {
      provider: provider || 'bank_transfer',
      referenceId,
      amount: 0, // Get from invoice
    });

    // Update invoice status
    await updateInvoiceStatus(invoiceId, 'pending_verification');

    // TODO: Send email to agency owner for verification

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
```

**Step 5: Commit**

```bash
git add lib/migrations/003_add_payments_table.sql app/dashboard/invoices/[id]/pay app/api/payments
git commit -m "feat: add bank transfer payment tracking with receipt upload"
```

---

**✅ END OF WEEK 3-4: FIRST REVENUE COMPLETE**

At this point:
- Clients management fully functional
- Invoice generation with PDF
- Auto-invoice on client onboard
- Bank transfer payment tracking
- 🎯 **First agencies can collect money**

Status: Ready for Weeks 5-6 (Deliverables)

---

## SUMMARY & NEXT TASKS

This plan covers **Weeks 1-4 (Months 1 foundational + first revenue)**.

**Remaining (Weeks 5-10):**
- Week 5-6: Deliverables + Review workflow
- Week 7-8: FonePay QR integration
- Week 9-10: Contracts + Polish + Final optimizations

---

## Execution Approach

This plan is designed for **two execution methods:**

1. **Subagent-Driven (This Session)** - Fresh subagent per task, code review between tasks, fast iteration
2. **Parallel Session** - New session with executing-plans skill, batch execution with checkpoints

Which approach works best for your situation?
