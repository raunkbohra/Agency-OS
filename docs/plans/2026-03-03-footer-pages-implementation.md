# Footer Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all 7 footer link pages (About, Blog, Careers, Contact, Privacy, Terms, Cookies) with shared components, MDX blog, and contact form email.

**Architecture:** Shared reusable components (`PageHero`, `ContentSection`, etc.) in `components/landing/`. All pages under `app/(marketing)/` inheriting the existing Navbar+Footer layout. Blog uses `@next/mdx` with `.mdx` files in `content/blog/`. Contact form sends email via existing Nodemailer setup in `lib/email.ts`.

**Tech Stack:** Next.js 16 App Router, @next/mdx, Tailwind CSS v4, Nodemailer, TypeScript

---

### Task 1: Install MDX dependencies and configure Next.js

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

**Step 1: Install @next/mdx and MDX packages**

Run: `npm install @next/mdx @mdx-js/loader @mdx-js/react`

**Step 2: Update next.config.ts to support MDX**

```typescript
import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const config: NextConfig = {
  serverExternalPackages: ['nodemailer', 'pg', 'pdf-lib'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.r2.cloudflarestorage.com' }],
  },
  poweredByHeader: false,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
};

const withMDX = createMDX({});

export default withMDX(config);
```

**Step 3: Create MDX components file**

Create `mdx-components.tsx` in project root:

```typescript
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-semibold mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1" style={{ color: 'var(--text-secondary)' }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>{children}</li>
    ),
    a: ({ children, href }) => (
      <a href={href} className="underline underline-offset-2 transition-colors" style={{ color: 'var(--accent-blue)' }}>{children}</a>
    ),
    strong: ({ children }) => (
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>
    ),
    hr: () => (
      <hr className="my-8" style={{ borderColor: 'var(--landing-divider)' }} />
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 pl-4 my-4 italic" style={{ borderColor: 'var(--accent-blue)', color: 'var(--text-tertiary)' }}>{children}</blockquote>
    ),
    ...components,
  };
}
```

**Step 4: Verify build works**

Run: `npx next build 2>&1 | tail -20`
Expected: Builds without errors

**Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts mdx-components.tsx
git commit -m "feat: add MDX support for blog and content pages"
```

---

### Task 2: Build shared landing page components

**Files:**
- Create: `components/landing/page-hero.tsx`
- Create: `components/landing/content-section.tsx`
- Create: `components/landing/team-card.tsx`
- Create: `components/landing/job-card.tsx`
- Create: `components/landing/blog-post-card.tsx`

**Step 1: Create PageHero component**

`components/landing/page-hero.tsx`:

```typescript
interface PageHeroProps {
  badge?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
}

export function PageHero({ badge, title, subtitle, lastUpdated }: PageHeroProps) {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {badge && (
          <span
            className="inline-block text-xs font-medium tracking-wider uppercase px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'var(--landing-badge-bg)',
              border: '1px solid var(--landing-badge-border)',
              color: 'var(--text-secondary)',
            }}
          >
            {badge}
          </span>
        )}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="text-sm mt-4" style={{ color: 'var(--text-quaternary)' }}>
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Create ContentSection component**

`components/landing/content-section.tsx`:

```typescript
interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function ContentSection({ children, className = '', narrow = false }: ContentSectionProps) {
  return (
    <section className={`px-6 pb-20 ${className}`}>
      <div className={`mx-auto ${narrow ? 'max-w-3xl' : 'max-w-4xl'}`}>
        {children}
      </div>
    </section>
  );
}
```

**Step 3: Create TeamCard component**

`components/landing/team-card.tsx`:

```typescript
import { Github, Linkedin, Twitter } from 'lucide-react';

interface TeamCardProps {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  social?: { github?: string; twitter?: string; linkedin?: string };
}

export function TeamCard({ name, role, bio, avatar, social }: TeamCardProps) {
  return (
    <div
      className="rounded-xl p-6 text-center transition-all duration-200"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
        style={{
          background: avatar ? `url(${avatar}) center/cover` : 'var(--landing-badge-bg)',
          border: '2px solid var(--landing-card-border)',
          color: 'var(--text-tertiary)',
        }}
      >
        {!avatar && name.split(' ').map(n => n[0]).join('')}
      </div>
      <h3 className="text-base font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{name}</h3>
      <p className="text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>{role}</p>
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-tertiary)' }}>{bio}</p>
      {social && (
        <div className="flex items-center justify-center gap-3">
          {social.github && (
            <a href={social.github} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Github size={16} />
            </a>
          )}
          {social.twitter && (
            <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Twitter size={16} />
            </a>
          )}
          {social.linkedin && (
            <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-quaternary)' }}>
              <Linkedin size={16} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create JobCard component**

`components/landing/job-card.tsx`:

```typescript
import { MapPin, Clock, ArrowRight } from 'lucide-react';

interface JobCardProps {
  title: string;
  department: string;
  location: string;
  type: string;
  applyUrl?: string;
}

export function JobCard({ title, department, location, type, applyUrl }: JobCardProps) {
  return (
    <div
      className="rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 group"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-sm mb-2" style={{ color: 'var(--accent-blue)' }}>{department}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <MapPin size={12} />{location}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={12} />{type}
          </span>
        </div>
      </div>
      {applyUrl && (
        <a
          href={applyUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all flex-shrink-0"
          style={{
            background: 'var(--landing-badge-bg)',
            border: '1px solid var(--landing-badge-border)',
            color: 'var(--text-primary)',
          }}
        >
          Apply <ArrowRight size={14} />
        </a>
      )}
    </div>
  );
}
```

**Step 5: Create BlogPostCard component**

`components/landing/blog-post-card.tsx`:

```typescript
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';

interface BlogPostCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
}

export function BlogPostCard({ slug, title, excerpt, date, readTime, author }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-xl p-6 transition-all duration-200 group"
      style={{
        background: 'var(--landing-card-bg)',
        border: '1px solid var(--landing-card-border)',
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--accent-blue)' }}>
        {author}
      </p>
      <h3
        className="text-lg font-semibold mb-2 transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--text-tertiary)' }}>
        {excerpt}
      </p>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-quaternary)' }}>
          <Calendar size={12} />{date}
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-quaternary)' }}>
          <Clock size={12} />{readTime}
        </span>
      </div>
    </Link>
  );
}
```

**Step 6: Commit**

```bash
git add components/landing/page-hero.tsx components/landing/content-section.tsx components/landing/team-card.tsx components/landing/job-card.tsx components/landing/blog-post-card.tsx
git commit -m "feat: add shared landing page components"
```

---

### Task 3: Build legal pages (Privacy, Terms, Cookies)

**Files:**
- Create: `app/(marketing)/privacy/page.tsx`
- Create: `app/(marketing)/terms/page.tsx`
- Create: `app/(marketing)/cookies/page.tsx`

**Step 1: Create Privacy Policy page**

`app/(marketing)/privacy/page.tsx` — Full page with `PageHero` + `ContentSection` containing real Agency OS privacy policy content. Sections: intro, data we collect (account data, project data, client data, usage data, payment data), how we use data, data sharing, cookies reference, data security, your rights (access, correction, deletion, export), data retention, children's privacy, changes to policy, contact.

**Step 2: Create Terms of Service page**

`app/(marketing)/terms/page.tsx` — Same structure. Sections: acceptance, account registration, subscription & payment, cancellation & refunds, acceptable use, intellectual property, client data ownership, service availability, limitation of liability, indemnification, dispute resolution, governing law, modifications, severability, contact.

**Step 3: Create Cookie Policy page**

`app/(marketing)/cookies/page.tsx` — Same structure. Sections: what cookies are, cookies we use (essential, analytics, preferences), third-party cookies, managing cookies (browser instructions), cookie consent, updates to policy, contact.

**Step 4: Verify pages render**

Run: `npm run dev` then visit `/privacy`, `/terms`, `/cookies`
Expected: Each page renders with PageHero + styled content sections, Navbar + Footer present

**Step 5: Commit**

```bash
git add app/\(marketing\)/privacy app/\(marketing\)/terms app/\(marketing\)/cookies
git commit -m "feat: add privacy, terms, and cookie policy pages"
```

---

### Task 4: Build About page

**Files:**
- Create: `app/(marketing)/about/page.tsx`

**Step 1: Create About page**

`app/(marketing)/about/page.tsx` — Compose from shared components:

1. `PageHero` with badge "Our Story", title "Built for agencies that ship", subtitle about Agency OS mission
2. Mission `ContentSection`: Why we built Agency OS — agencies juggle clients, deliverables, invoices, contracts across scattered tools. Agency OS unifies it.
3. Values grid: 4 cards in a `grid grid-cols-1 sm:grid-cols-2` layout. Values: Transparency (open pricing, clear data practices), Simplicity (do one thing well, no bloat), Speed (fast UI, ship features weekly), Client-First (everything designed around the agency-client relationship).
4. Team section: 3-4 `TeamCard` components with sample team members
5. CTA section: "Ready to streamline your agency?" with link to `/auth/signup`

**Step 2: Verify page renders**

Run: Visit `/about`
Expected: Hero + mission + values grid + team + CTA, responsive on mobile

**Step 3: Commit**

```bash
git add app/\(marketing\)/about
git commit -m "feat: add about page"
```

---

### Task 5: Build Careers page

**Files:**
- Create: `app/(marketing)/careers/page.tsx`

**Step 1: Create Careers page**

`app/(marketing)/careers/page.tsx` — Compose:

1. `PageHero` with badge "Careers", title "Join the team building the future of agency work", subtitle
2. Culture `ContentSection`: Short paragraph about remote-first, async, small team, ship fast
3. Perks grid: 6 perks in `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3`. Perks: Remote-First, Competitive Equity, Learning Budget ($1k/yr), Flexible Hours, Health & Wellness, Latest Hardware
4. Open positions: 3 `JobCard` components (Senior Full-Stack Engineer / Engineering / Remote / Full-time, Product Designer / Design / Remote / Full-time, Growth Lead / Marketing / Remote / Full-time)
5. Fallback CTA: "Don't see your role? Send us a note at careers@agencyos.dev"

**Step 2: Verify page renders**

Run: Visit `/careers`
Expected: Hero + culture + perks + job cards + CTA

**Step 3: Commit**

```bash
git add app/\(marketing\)/careers
git commit -m "feat: add careers page"
```

---

### Task 6: Build Contact page with email API

**Files:**
- Create: `components/landing/contact-form.tsx`
- Create: `app/api/contact/route.ts`
- Create: `app/(marketing)/contact/page.tsx`

**Step 1: Create contact email function**

Add to `lib/email.ts`:

```typescript
export async function sendContactFormEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedSubject = escapeHtml(subject);
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const html = `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f6f7f9;padding:40px 0;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div style="padding:32px;">
          <h1 style="font-size:20px;font-weight:600;color:#0d1117;margin:0 0 24px;">New Contact Form Submission</h1>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#6b7e93;font-size:14px;width:80px;">Name</td><td style="padding:8px 0;color:#0d1117;font-size:14px;">${escapedName}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7e93;font-size:14px;">Email</td><td style="padding:8px 0;color:#0d1117;font-size:14px;"><a href="mailto:${escapedEmail}" style="color:#4a6278;">${escapedEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#6b7e93;font-size:14px;">Subject</td><td style="padding:8px 0;color:#0d1117;font-size:14px;">${escapedSubject}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f6f7f9;border-radius:8px;">
            <p style="margin:0;color:#0d1117;font-size:14px;line-height:1.6;">${escapedMessage}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@agencyos.dev',
    to: process.env.CONTACT_EMAIL ?? process.env.SMTP_FROM ?? 'hello@agencyos.dev',
    replyTo: email,
    subject: `[Agency OS Contact] ${subject} — from ${name}`,
    html,
  });
}
```

**Step 2: Create API route**

`app/api/contact/route.ts`:

```typescript
import { sendContactFormEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await sendContactFormEmail({ name, email, subject, message });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
```

**Step 3: Create ContactForm client component**

`components/landing/contact-form.tsx` — Client component (`'use client'`) with form fields (name, email, subject dropdown, message textarea), loading state, success/error state. Submits to `/api/contact`. Styled with CSS variables matching landing design. Subject options: General Inquiry, Sales, Support, Partnership.

**Step 4: Create Contact page**

`app/(marketing)/contact/page.tsx` — Two-column layout: ContactForm on left, info panel on right (email address, social links, "We typically respond within 24 hours").

**Step 5: Test contact form**

Run: Visit `/contact`, fill form, submit
Expected: Email appears in MailHog at `http://localhost:8025`

**Step 6: Commit**

```bash
git add lib/email.ts app/api/contact components/landing/contact-form.tsx app/\(marketing\)/contact
git commit -m "feat: add contact page with email notifications"
```

---

### Task 7: Build Blog with MDX posts

**Files:**
- Create: `content/blog/why-we-built-agency-os.mdx`
- Create: `content/blog/5-tips-for-agency-workflows.mdx`
- Create: `content/blog/introducing-client-portals.mdx`
- Create: `lib/blog.ts` (utility to read MDX posts)
- Create: `app/(marketing)/blog/page.tsx`
- Create: `app/(marketing)/blog/[slug]/page.tsx`

**Step 1: Create blog utility**

`lib/blog.ts` — Reads `.mdx` files from `content/blog/`, parses frontmatter (title, excerpt, date, author, readTime, tags), returns sorted posts array. Exports `getAllPosts()` and `getPostBySlug()`.

**Step 2: Create 3 starter MDX posts**

Each post in `content/blog/` with frontmatter:

```
---
title: "Why We Built Agency OS"
excerpt: "The story behind building a unified platform for creative agencies..."
date: "2026-02-15"
author: "Agency OS Team"
readTime: "5 min read"
tags: ["product", "announcement"]
---
```

Write 3-4 paragraphs of real content for each post.

**Step 3: Create blog listing page**

`app/(marketing)/blog/page.tsx` — `PageHero` with "Blog" badge + title, then grid of `BlogPostCard` components populated from `getAllPosts()`.

**Step 4: Create blog post page**

`app/(marketing)/blog/[slug]/page.tsx` — Reads post by slug, renders MDX content with prose styling. Includes back link, author, date, read time. Uses `generateStaticParams` for static generation.

**Step 5: Verify blog works**

Run: Visit `/blog` — see 3 post cards. Click one — see full post with styled MDX.

**Step 6: Commit**

```bash
git add content/blog lib/blog.ts app/\(marketing\)/blog
git commit -m "feat: add MDX blog with starter posts"
```

---

### Task 8: Update footer links and final cleanup

**Files:**
- Modify: `components/landing/footer.tsx`

**Step 1: Update footer links**

In `components/landing/footer.tsx`, update the `footerLinks` object:

```typescript
const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#workflow' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Client Portal', href: '#' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};
```

**Step 2: Verify all footer links work**

Click each link in footer — all should navigate to real pages.

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new errors from our changes

**Step 4: Commit and push**

```bash
git add components/landing/footer.tsx
git commit -m "feat: update footer links to point to real pages"
git push
```
