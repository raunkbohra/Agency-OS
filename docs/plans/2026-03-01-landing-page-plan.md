# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a world-class Linear.app-inspired landing page for Agency OS with hero, features bento grid, workflow, metrics showcase, pricing, CTA, and footer sections.

**Architecture:** Next.js `(marketing)` route group with its own layout (floating glass navbar + footer). Section components live in `components/landing/`. Existing motion components (`ScrollReveal`, `ScrollStagger`, `MagneticHover`, `HoverCardGlow`) and design tokens are reused — no new CSS or dependencies.

**Tech Stack:** Next.js 16, React, Tailwind CSS, Framer Motion, Lucide icons. All existing in the project.

**Design doc:** `docs/plans/2026-03-01-landing-page-design.md`

---

### Task 1: Route Group Setup + Footer

**Files:**
- Move: `app/page.tsx` → `app/(marketing)/page.tsx`
- Create: `app/(marketing)/layout.tsx`
- Create: `components/landing/footer.tsx`

**Step 1: Create the footer component (server component, no 'use client')**

Create `components/landing/footer.tsx`:

```tsx
import Link from 'next/link';

const productLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Dashboard', href: '/dashboard' },
];

const companyLinks = [
  { label: 'About', href: '#' },
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Contact', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-primary">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-md bg-accent-blue flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-semibold text-text-primary tracking-tight">Agency OS</span>
            </div>
            <p className="text-sm text-text-tertiary">
              Run your marketing agency from one system.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-4">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-medium text-text-primary mb-4">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border-default">
          <p className="text-xs text-text-quaternary">&copy; 2026 Agency OS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Create the marketing layout**

Create `app/(marketing)/layout.tsx`:

```tsx
import { Footer } from '@/components/landing/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
```

**Step 3: Move the page**

Move `app/page.tsx` to `app/(marketing)/page.tsx`. Keep the existing placeholder content for now — it will be replaced in Task 3.

**Step 4: Verify**

Run: `npm run dev` — navigate to `http://localhost:3000`. Should see the existing placeholder content + footer below. Dashboard at `/dashboard` should still work with its own sidebar layout.

**Step 5: Commit**

```bash
git add app/\(marketing\) components/landing/footer.tsx
git rm app/page.tsx
git commit -m "feat: add (marketing) route group with footer"
```

---

### Task 2: Floating Navbar

**Files:**
- Create: `components/landing/navbar.tsx`
- Modify: `app/(marketing)/layout.tsx`

**Step 1: Create the navbar component**

Create `components/landing/navbar.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'backdrop-blur-xl bg-glass-bg border-b border-glass-border'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent-blue flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-text-primary tracking-tight">Agency OS</span>
        </Link>

        <Button variant="secondary" size="sm" asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    </nav>
  );
}
```

**Step 2: Add navbar to marketing layout**

Modify `app/(marketing)/layout.tsx` — add `import { Navbar }` and render `<Navbar />` before `{children}`.

```tsx
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
```

**Step 3: Verify**

Scroll the page — navbar should start transparent and gain glass effect after 100px scroll. Logo and "Sign In" button visible. Sign In links to `/auth/signin`.

**Step 4: Commit**

```bash
git add components/landing/navbar.tsx app/\(marketing\)/layout.tsx
git commit -m "feat: add floating glass navbar with scroll detection"
```

---

### Task 3: Hero Section

**Files:**
- Create: `components/landing/hero.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the hero component**

Create `components/landing/hero.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-5xl mt-16 px-4">
      <div
        className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden shadow-2xl shadow-black/50"
        style={{ transform: 'perspective(1000px) rotateX(2deg)' }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-primary">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
            <div className="w-3 h-3 rounded-full bg-text-quaternary/40" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-6 rounded-md bg-bg-tertiary max-w-xs mx-auto" />
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6">
          {/* Metric cards row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['Revenue', 'Clients', 'Deliverables', 'Plans'].map((label) => (
              <div key={label} className="rounded-lg border border-border-default bg-bg-primary p-4">
                <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-1">{label}</div>
                <div className="h-5 w-16 rounded bg-bg-tertiary" />
              </div>
            ))}
          </div>

          {/* Table mockup */}
          <div className="rounded-lg border border-border-default overflow-hidden">
            <div className="bg-bg-tertiary px-4 py-2 flex gap-16">
              {['Client', 'Plan', 'Status', 'Amount'].map((h) => (
                <div key={h} className="text-[10px] text-text-tertiary font-medium uppercase tracking-wide">{h}</div>
              ))}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-4 py-3 border-t border-border-default flex gap-16 items-center">
                <div className="h-3 w-20 rounded bg-bg-tertiary" />
                <div className="h-3 w-16 rounded bg-bg-tertiary" />
                <div className="h-5 w-14 rounded-full bg-accent-green/10" />
                <div className="h-3 w-12 rounded bg-bg-tertiary" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effect under mockup */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-accent-blue/5 blur-3xl rounded-full" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 bg-dot-grid overflow-hidden">
      {/* Radial glow behind headline */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-blue/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-secondary px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            Built for modern agencies
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mt-8 text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.1]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Run your agency
        </motion.h1>
        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.1] gradient-text-subtle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          from one system
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-lg md:text-xl text-text-secondary max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Plans, clients, invoices, deliverables, and contracts — all in one place. Built for agencies that ship.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Button variant="primary" size="lg" asChild>
            <Link href="/auth/signin">Get Started</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="#features">See how it works</Link>
          </Button>
        </motion.div>
      </div>

      {/* Dashboard mockup */}
      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <DashboardMockup />
      </motion.div>
    </section>
  );
}
```

**Step 2: Replace placeholder page**

Overwrite `app/(marketing)/page.tsx`:

```tsx
import { Hero } from '@/components/landing/hero';

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  );
}
```

**Step 3: Verify**

Visit `http://localhost:3000`. Should see:
- Floating navbar (transparent at top)
- Badge pill with green dot
- Two-line headline with gradient on second line
- Subheadline text
- Two CTA buttons (blue "Get Started" + outline "See how it works")
- Dashboard mockup with perspective tilt and glow underneath
- Footer at bottom
- All elements animate in with staggered delays

**Step 4: Commit**

```bash
git add components/landing/hero.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add hero section with gradient text and dashboard mockup"
```

---

### Task 4: Features Bento Grid

**Files:**
- Create: `components/landing/features-grid.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the features grid component**

Create `components/landing/features-grid.tsx`:

```tsx
'use client';

import { Package, FileText, FileSignature, Users, CreditCard, BarChart3 } from 'lucide-react';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';
import { HoverCardGlow } from '@/components/motion/hover-card-glow';

const features = [
  {
    icon: Package,
    title: 'Plans & Pricing',
    description: 'Create service plans with custom deliverables, pricing tiers, and billing cycles. Assign plans to clients in one click.',
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    icon: FileText,
    title: 'Invoices',
    description: 'Auto-generate invoices when clients sign up. Track payment status and send reminders.',
    className: '',
  },
  {
    icon: FileSignature,
    title: 'Contracts',
    description: 'Upload and manage contracts. Track signatures and expiration dates.',
    className: '',
  },
  {
    icon: Users,
    title: 'Clients',
    description: 'Manage your client roster with plans, invoices, and deliverables linked automatically.',
    className: '',
  },
  {
    icon: CreditCard,
    title: 'Deliverables',
    description: 'Track every deliverable across clients. Status workflows from draft to approved with client portal access.',
    className: 'md:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'Metrics Dashboard',
    description: 'Real-time MRR, ARR, collection rates, and operational metrics. Know exactly how your agency is performing.',
    className: 'md:col-span-3',
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            From plans to payments, manage every aspect of your agency in one place.
          </p>
        </div>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <ScrollStaggerItem key={feature.title} className={feature.className}>
              <HoverCardGlow className="h-full rounded-xl border border-border-default bg-bg-secondary p-6 transition-all duration-200 hover:border-border-hover hover:-translate-y-px">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent-blue/10">
                    <feature.icon className="h-5 w-5 text-accent-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mt-1">{feature.title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </HoverCardGlow>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
```

**Step 2: Add to page**

Modify `app/(marketing)/page.tsx` — import `FeaturesGrid` and add `<FeaturesGrid />` after `<Hero />`.

**Step 3: Verify**

Scroll down past hero. Features should appear with stagger animation. Hover on cards should show radial glow effect. Bento layout should have the large Plans card spanning 2 cols/rows.

**Step 4: Commit**

```bash
git add components/landing/features-grid.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add bento features grid with hover glow"
```

---

### Task 5: Workflow Section

**Files:**
- Create: `components/landing/workflow.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the workflow component**

Create `components/landing/workflow.tsx`:

```tsx
'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const steps = [
  {
    number: '1',
    title: 'Create a Plan',
    description: 'Define your services, set pricing, and configure billing cycles for your offerings.',
  },
  {
    number: '2',
    title: 'Add Clients',
    description: 'Onboard clients in seconds. Assign plans, auto-generate invoices, and start tracking.',
  },
  {
    number: '3',
    title: 'Get Paid',
    description: 'Clients receive invoices with payment options. Track collections and manage cash flow.',
  },
];

export function Workflow() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">
            How it works
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Three steps to running your agency on autopilot.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-6 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-border-default via-accent-blue/30 to-border-default" />

          {steps.map((step, i) => (
            <ScrollReveal key={step.number} direction="up" delay={i * 0.15}>
              <div className="relative text-center">
                {/* Step number */}
                <div className="relative z-10 mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent-blue bg-bg-primary text-lg font-bold text-accent-blue">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary max-w-xs mx-auto">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add to page**

Modify `app/(marketing)/page.tsx` — import `Workflow` and add `<Workflow />` after `<FeaturesGrid />`.

**Step 3: Verify & Commit**

```bash
git add components/landing/workflow.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add workflow section with connected steps"
```

---

### Task 6: Metrics Showcase

**Files:**
- Create: `components/landing/metrics-showcase.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the metrics showcase component**

Create `components/landing/metrics-showcase.tsx`:

```tsx
'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';

const metrics = [
  { value: '100%', label: 'Automated' },
  { value: '5 min', label: 'Setup Time' },
  { value: '∞', label: 'Clients' },
  { value: '$0', label: 'To Start' },
];

export function MetricsShowcase() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="relative rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-xl p-12 md:p-16 overflow-hidden">
            {/* Aurora background */}
            <div className="absolute inset-0 bg-aurora pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
```

**Step 2: Add to page**

Modify `app/(marketing)/page.tsx` — import and add `<MetricsShowcase />` after `<Workflow />`.

**Step 3: Verify & Commit**

```bash
git add components/landing/metrics-showcase.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add metrics showcase with glass card"
```

---

### Task 7: Pricing Section

**Files:**
- Create: `components/landing/pricing.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the pricing component**

Create `components/landing/pricing.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollStagger, ScrollStaggerItem } from '@/components/motion/scroll-stagger';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
  featured: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For freelancers getting started.',
    features: [
      { text: 'Up to 3 clients', included: true },
      { text: '1 service plan', included: true },
      { text: 'Basic invoicing', included: true },
      { text: 'Contracts', included: false },
      { text: 'Deliverables tracking', included: false },
      { text: 'Metrics dashboard', included: false },
    ],
    cta: 'Get Started',
    ctaHref: '/auth/signin',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For growing agencies.',
    features: [
      { text: 'Unlimited clients', included: true },
      { text: 'Unlimited plans', included: true },
      { text: 'Advanced invoicing', included: true },
      { text: 'Contracts', included: true },
      { text: 'Deliverables tracking', included: true },
      { text: 'Metrics dashboard', included: true },
    ],
    cta: 'Get Started',
    ctaHref: '/auth/signin',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For established agencies.',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom branding', included: true },
    ],
    cta: 'Contact Us',
    ctaHref: '#',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-text-primary">
            Simple pricing
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Start free. Upgrade when you need to.
          </p>
        </div>

        <ScrollStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <ScrollStaggerItem key={tier.name}>
              <div
                className={`relative rounded-xl p-8 h-full flex flex-col ${
                  tier.featured
                    ? 'border-2 border-accent-blue/30 bg-bg-secondary animated-border'
                    : 'border border-border-default bg-bg-secondary'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent-blue px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold tracking-tight text-text-primary">{tier.price}</span>
                  <span className="text-text-tertiary">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-accent-green flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-text-quaternary flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-sm text-text-secondary' : 'text-sm text-text-quaternary line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.featured ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link href={tier.ctaHref}>{tier.cta}</Link>
                </Button>
              </div>
            </ScrollStaggerItem>
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}
```

**Step 2: Add to page**

Modify `app/(marketing)/page.tsx` — import and add `<Pricing />` after `<MetricsShowcase />`.

**Step 3: Verify & Commit**

```bash
git add components/landing/pricing.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add pricing section with three tiers"
```

---

### Task 8: Final CTA Section

**Files:**
- Create: `components/landing/cta-section.tsx`
- Modify: `app/(marketing)/page.tsx`

**Step 1: Create the CTA component**

Create `components/landing/cta-section.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MagneticHover } from '@/components/motion/magnetic-hover';
import { ScrollReveal } from '@/components/motion/scroll-reveal';

export function CtaSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none" />

      <ScrollReveal>
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight gradient-text-subtle">
            Ready to streamline your agency?
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Join agencies that run smarter, not harder.
          </p>
          <div className="mt-8">
            <MagneticHover strength={0.15}>
              <Button variant="primary" size="lg" className="shadow-[0_0_30px_rgba(0,112,243,0.25)]" asChild>
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </MagneticHover>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
```

**Step 2: Add to page**

Modify `app/(marketing)/page.tsx` — import and add `<CtaSection />` after `<Pricing />`.

**Step 3: Verify & Commit**

```bash
git add components/landing/cta-section.tsx app/\(marketing\)/page.tsx
git commit -m "feat: add final CTA section with magnetic hover button"
```

---

### Task 9: Final Assembly + Build Verification

**Files:**
- Verify: `app/(marketing)/page.tsx` (should have all sections)

**Step 1: Verify final page assembly**

The final `app/(marketing)/page.tsx` should look like:

```tsx
import { Hero } from '@/components/landing/hero';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { Workflow } from '@/components/landing/workflow';
import { MetricsShowcase } from '@/components/landing/metrics-showcase';
import { Pricing } from '@/components/landing/pricing';
import { CtaSection } from '@/components/landing/cta-section';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <Workflow />
      <MetricsShowcase />
      <Pricing />
      <CtaSection />
    </main>
  );
}
```

**Step 2: Run build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors, no warnings.

**Step 3: Run dev and verify all sections**

```bash
npm run dev
```

Check:
- [ ] Navbar: transparent → glass on scroll
- [ ] Hero: badge, two-line headline, CTAs, dashboard mockup
- [ ] Features: bento grid with hover glow
- [ ] Workflow: 3 steps with connecting line
- [ ] Metrics: glass card with 4 stats
- [ ] Pricing: 3 tiers, Pro card featured with animated border
- [ ] CTA: gradient text, magnetic button
- [ ] Footer: 3 columns, copyright
- [ ] Mobile: all sections stack single-column
- [ ] Dashboard (`/dashboard`): still works with sidebar layout

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete landing page with all sections"
git push
```
