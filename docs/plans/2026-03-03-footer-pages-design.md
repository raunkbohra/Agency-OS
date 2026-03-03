# Footer Pages Design

**Date:** 2026-03-03
**Status:** Approved

## Overview

Build all 7 footer link pages for Agency OS: About, Blog, Careers, Contact, Privacy Policy, Terms of Service, Cookie Policy. All pages use real SaaS content tailored to Agency OS as a project management platform for creative agencies.

## Architecture

All pages live under `app/(marketing)/` (existing route group with Navbar + Footer layout).

### New Routes

```
app/(marketing)/
  about/page.tsx
  blog/page.tsx
  blog/[slug]/page.tsx
  careers/page.tsx
  contact/page.tsx
  privacy/page.tsx
  terms/page.tsx
  cookies/page.tsx
```

### Shared Components (`components/landing/`)

- **PageHero** — Title + subtitle + optional badge. Used on every page.
- **ContentSection** — Alternating text blocks with optional side content. For About, legal pages.
- **TeamCard** — Photo + name + role + social links. For About page.
- **JobCard** — Title + department + location + type + apply link. For Careers page.
- **BlogPostCard** — Thumbnail + title + excerpt + date + read time. For Blog listing.
- **ContactForm** — Name, email, subject, message fields. Submits to API.

### Blog (MDX)

- Blog posts as `.mdx` files in `content/blog/`
- Frontmatter: `title`, `excerpt`, `date`, `author`, `tags`, `coverImage`
- `@next/mdx` for rendering
- Listing page reads all MDX files, sorted by date
- Individual posts via `blog/[slug]/page.tsx`

### Contact API

- `app/api/contact/route.ts` — validates form, sends email via Nodemailer
- Sends to configurable email address (env var or agency settings)

### Footer Updates

- Update all `#` placeholder links in `components/landing/footer.tsx` to real routes

## Page Designs

### About (`/about`)
- Hero: "Built for agencies that ship"
- Mission section: Why we built Agency OS (agency management pain points, our solution)
- Values grid: 3-4 values (Transparency, Simplicity, Speed, Client-first)
- Team section: TeamCard components with placeholder photos, names, roles
- CTA: "Ready to streamline your agency?" → Sign up

### Blog (`/blog` + `/blog/[slug]`)
- Listing: Grid of BlogPostCards (3 col desktop, 1 mobile), sorted by date
- Post page: MDX rendered with prose styling, author byline, date, back link
- 2-3 starter posts: "Why we built Agency OS", "5 tips for agency workflows", "Introducing client portals"

### Careers (`/careers`)
- Hero: "Join the team building the future of agency work"
- Culture blurb about working at Agency OS
- Perks grid: 4-6 perks (Remote-first, Equity, Learning budget, Flexible hours)
- Job listings: 2-3 sample JobCards (Full-Stack Engineer, Designer, Growth Lead)
- Fallback CTA: "Don't see your role? Email us at careers@..."

### Contact (`/contact`)
- Hero: "Get in touch"
- Two-column: Form (left) + info (right: email, social links, response time)
- Form fields: Name, Email, Subject dropdown (General/Sales/Support/Partnership), Message
- Success state: "Thanks! We'll get back within 24 hours"

### Privacy Policy (`/privacy`)
- Hero: "Privacy Policy" + last updated date
- Sections: Data collection, usage, sharing, cookies, security, user rights, contact
- Real content about project data, client data, billing data

### Terms of Service (`/terms`)
- Hero: "Terms of Service" + last updated date
- Sections: Acceptance, account terms, payment, cancellation, IP, liability, governing law

### Cookie Policy (`/cookies`)
- Hero: "Cookie Policy" + last updated date
- Sections: What cookies are, types used (essential, analytics, preferences), managing cookies

## Styling

- All pages use existing CSS variables and landing-specific tokens
- Dark/light theme support via existing `.light` class toggle
- Responsive: mobile-first with `md:` breakpoints
- Typography: Inter Variable (body) + Plus Jakarta Sans (headings)
- Glass card effects and gradient accents consistent with homepage

## Tech Stack

- Next.js App Router (existing)
- @next/mdx for blog posts
- Nodemailer for contact form (existing setup)
- Tailwind CSS v4 (existing)
