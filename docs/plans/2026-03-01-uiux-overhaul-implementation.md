# UI/UX Overhaul Implementation Plan: Linear-Inspired Dark-First Agency OS

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Agency OS from functional-but-basic to a world-class, Linear-inspired dark-first interface with microanimations, glass effects, and premium typography across all 19 pages.

**Architecture:** Dark-first design system built on CSS custom properties + Tailwind tokens. shadcn/ui provides accessible component primitives, restyled for the dark aesthetic. Framer Motion handles all microanimations. Sidebar layout replaces top navigation. Every page gets a full visual overhaul.

**Tech Stack:** Tailwind CSS 4, Framer Motion, shadcn/ui (Radix), @fontsource/inter, CSS custom properties, Next.js 16 app router

**Design Reference:** `docs/plans/2026-03-01-uiux-overhaul-design.md`

---

## Task 1: Install Dependencies + Design Tokens + globals.css

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `lib/utils.ts` (if not exists)

**Step 1: Install dependencies**

```bash
cd /Users/raunakbohra/Desktop/Agency\ OS
npm install framer-motion @fontsource-variable/inter
```

**Step 2: Replace globals.css with full design token system**

```css
/* app/globals.css */
@import "tailwindcss";
@import "@fontsource-variable/inter";

@layer base {
  :root {
    /* Default: Dark mode */
    --bg-primary: #0A0A0B;
    --bg-secondary: #111113;
    --bg-tertiary: #1A1A1D;
    --bg-hover: #222225;

    --border-default: rgba(255, 255, 255, 0.06);
    --border-hover: rgba(255, 255, 255, 0.12);
    --border-active: rgba(255, 255, 255, 0.20);

    --text-primary: #EDEDEF;
    --text-secondary: #8B8B8E;
    --text-tertiary: #5C5C5F;

    --accent-blue: #5B7FFF;
    --accent-purple: #8B5CF6;
    --accent-green: #34D399;
    --accent-amber: #FBBF24;
    --accent-red: #EF4444;

    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.06);

    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;

    --duration-fast: 120ms;
    --duration-normal: 200ms;
    --duration-slow: 350ms;

    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

    --sidebar-width: 240px;
  }

  .light {
    --bg-primary: #FFFFFF;
    --bg-secondary: #FAFAFA;
    --bg-tertiary: #F4F4F5;
    --bg-hover: #EBEBED;

    --border-default: rgba(0, 0, 0, 0.06);
    --border-hover: rgba(0, 0, 0, 0.12);
    --border-active: rgba(0, 0, 0, 0.20);

    --text-primary: #09090B;
    --text-secondary: #71717A;
    --text-tertiary: #A1A1AA;

    --glass-bg: rgba(0, 0, 0, 0.02);
    --glass-border: rgba(0, 0, 0, 0.06);
  }

  * {
    border-color: var(--border-default);
  }

  body {
    font-family: 'Inter Variable', system-ui, -apple-system, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--border-hover);
    border-radius: var(--radius-full);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-active);
  }

  /* Selection */
  ::selection {
    background: rgba(91, 127, 255, 0.3);
  }

  /* Focus visible ring */
  :focus-visible {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
  }
}

/* Shimmer animation for skeletons */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Pulse dot animation */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.animate-pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
```

**Step 3: Update root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agency OS',
  description: 'World-class agency management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
```

**Step 4: Create/update lib/utils.ts**

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 5: Install tailwind-merge if not present**

```bash
npm install tailwind-merge
```

**Step 6: Verify — run dev server and check dark background renders**

```bash
npm run dev
```

Expected: App loads with #0A0A0B dark background, Inter font, custom scrollbar

**Step 7: Commit**

```bash
git add package.json package-lock.json app/globals.css app/layout.tsx lib/utils.ts
git commit -m "feat: add design tokens, Inter font, dark-first CSS variables"
```

---

## Task 2: Tailwind Config + Extended Theme

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Extend Tailwind config with design tokens**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'md': ['15px', { lineHeight: '22px' }],
        'lg': ['18px', { lineHeight: '26px' }],
        'xl': ['22px', { lineHeight: '30px', letterSpacing: '-0.02em' }],
        '2xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '3xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
        border: {
          default: 'var(--border-default)',
          hover: 'var(--border-hover)',
          active: 'var(--border-active)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          purple: 'var(--accent-purple)',
          green: 'var(--accent-green)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-red)',
        },
        glass: {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'var(--ease-out)',
        'ease-in-custom': 'var(--ease-in)',
        'ease-spring': 'var(--ease-spring)',
      },
      boxShadow: {
        'glass': '0 0 0 1px var(--glass-border), 0 1px 2px rgba(0,0,0,0.3)',
        'glass-hover': '0 0 0 1px var(--border-hover), 0 4px 12px rgba(0,0,0,0.4)',
        'glow-blue': '0 0 0 1px var(--accent-blue), 0 0 0 4px rgba(91,127,255,0.15)',
        'glow-red': '0 0 0 1px var(--accent-red), 0 0 0 4px rgba(239,68,68,0.15)',
      },
      spacing: {
        'sidebar': 'var(--sidebar-width)',
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
```

**Step 2: Verify — check that Tailwind classes like `bg-bg-primary`, `text-text-secondary` work**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: extend Tailwind config with full design token system"
```

---

## Task 3: shadcn/ui Component Generation + Dark Customization

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/tooltip.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/switch.tsx`
- Create: `components/ui/avatar.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/toast.tsx` + `components/ui/toaster.tsx` + `components/ui/use-toast.ts`

**Step 1: Initialize shadcn/ui**

```bash
cd /Users/raunakbohra/Desktop/Agency\ OS
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes
- Tailwind CSS config: tailwind.config.ts
- Components alias: @/components
- Utils alias: @/lib/utils

**Step 2: Generate core components**

```bash
npx shadcn@latest add button card badge input skeleton separator tooltip dialog tabs switch avatar dropdown-menu select toast
```

**Step 3: Customize Button for dark-first with variants**

Replace the generated button.tsx with dark-first styling:

```tsx
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm',
        secondary:
          'border border-border-default bg-transparent text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover',
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        danger:
          'text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20',
        link:
          'text-accent-blue underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 text-sm gap-2',
        lg: 'h-10 px-5 text-sm gap-2',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {loading ? null : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Step 4: Customize Card for glass morphism**

```tsx
// components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; highlighted?: boolean }
>(({ className, interactive, highlighted, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-border-default bg-bg-secondary p-5 transition-all duration-fast',
      interactive && 'cursor-pointer hover:border-border-hover hover:shadow-glass-hover hover:-translate-y-px',
      highlighted && 'border-l-2 border-l-accent-blue',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-semibold tracking-tight text-text-primary', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
```

**Step 5: Customize Badge for status indicators**

```tsx
// components/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-border-default text-text-secondary',
        success: 'border border-accent-green/20 text-accent-green bg-accent-green/10',
        warning: 'border border-accent-amber/20 text-accent-amber bg-accent-amber/10',
        danger: 'border border-accent-red/20 text-accent-red bg-accent-red/10',
        info: 'border border-accent-blue/20 text-accent-blue bg-accent-blue/10',
        purple: 'border border-accent-purple/20 text-accent-purple bg-accent-purple/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
```

**Step 6: Customize Input for dark-first**

```tsx
// components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-fast',
          'border-border-default',
          'focus:outline-none focus:border-accent-blue focus:shadow-glow-blue',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-accent-red focus:border-accent-red focus:shadow-glow-red',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

**Step 7: Create Skeleton with shimmer**

```tsx
// components/ui/skeleton.tsx
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

**Step 8: Verify — import a Button in any page and check dark styling**

```bash
npm run dev
```

Expected: Components render with dark backgrounds, accent colors, proper transitions

**Step 9: Commit**

```bash
git add components/ui/ components.json lib/utils.ts
git commit -m "feat: add shadcn/ui components customized for dark-first Linear aesthetic"
```

---

## Task 4: Framer Motion Wrappers

**Files:**
- Create: `components/motion/page-transition.tsx`
- Create: `components/motion/stagger-children.tsx`
- Create: `components/motion/fade-in.tsx`
- Create: `components/motion/press-scale.tsx`

**Step 1: Create PageTransition wrapper**

```tsx
// components/motion/page-transition.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Create StaggerChildren wrapper**

```tsx
// components/motion/stagger-children.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
```

**Step 3: Create FadeIn wrapper**

```tsx
// components/motion/fade-in.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({ children, className, delay = 0, duration = 0.2, direction = 'up' }: FadeInProps) {
  const directionMap = {
    up: { y: 8 },
    down: { y: -8 },
    left: { x: 8 },
    right: { x: -8 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 4: Create PressScale wrapper**

```tsx
// components/motion/press-scale.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PressScaleProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function PressScale({ children, className, scale = 0.98 }: PressScaleProps) {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ duration: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 5: Commit**

```bash
git add components/motion/
git commit -m "feat: add Framer Motion animation wrappers (page-transition, stagger, fade-in, press-scale)"
```

---

## Task 5: Sidebar Layout + Mobile Nav

**Files:**
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/sidebar-nav-item.tsx`
- Create: `components/layout/page-header.tsx`
- Create: `components/layout/mobile-nav.tsx`
- Modify: `app/dashboard/layout.tsx`

**Step 1: Create SidebarNavItem**

```tsx
// components/layout/sidebar-nav-item.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function SidebarNavItem({ href, icon: Icon, label }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-fast',
        isActive
          ? 'text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-md bg-bg-tertiary"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}
      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
```

**Step 2: Create Sidebar**

```tsx
// components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { SidebarNavItem } from './sidebar-nav-item';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  CreditCard,
  FileSignature,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  { href: '/dashboard/plans', icon: Package, label: 'Plans' },
  { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
  { href: '/dashboard/deliverables', icon: CreditCard, label: 'Deliverables' },
  { href: '/dashboard/contracts', icon: FileSignature, label: 'Contracts' },
  { href: '/dashboard/metrics', icon: BarChart3, label: 'Metrics' },
];

const bottomItems = [
  { href: '/dashboard/settings/payments', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-sidebar flex-col border-r border-border-default bg-bg-primary">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-border-default">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent-blue flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-text-primary tracking-tight">Agency OS</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
          Workspace
        </p>
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-default px-3 py-3 space-y-1">
        {bottomItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} />
        ))}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all duration-fast"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
```

**Step 3: Create MobileNav**

```tsx
// components/layout/mobile-nav.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-bg-secondary border border-border-default hover:bg-bg-hover transition-colors"
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed left-0 top-0 z-50 lg:hidden"
            >
              <Sidebar />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-bg-hover transition-colors"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

**Step 4: Create PageHeader**

```tsx
// components/layout/page-header.tsx
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
```

**Step 5: Update dashboard layout**

```tsx
// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile nav */}
      <MobileNav />

      {/* Main content */}
      <main className="lg:pl-sidebar">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**Step 6: Verify — sidebar renders, active item highlights, mobile hamburger works**

```bash
npm run dev
```

**Step 7: Commit**

```bash
git add components/layout/ app/dashboard/layout.tsx
git commit -m "feat: add sidebar navigation, mobile nav, page header — replace top nav"
```

---

## Task 6: Shared Components

**Files:**
- Create: `components/shared/status-badge.tsx`
- Create: `components/shared/metric-card.tsx`
- Create: `components/shared/empty-state.tsx`
- Create: `components/shared/loading-skeleton.tsx`
- Create: `components/shared/animated-number.tsx`
- Create: `components/shared/glass-card.tsx`

**Step 1: Create StatusBadge**

```tsx
// components/shared/status-badge.tsx
import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { variant: any; label: string; pulse?: boolean }> = {
  // Invoice statuses
  draft: { variant: 'default', label: 'Draft' },
  pending: { variant: 'warning', label: 'Pending', pulse: true },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'danger', label: 'Overdue', pulse: true },
  cancelled: { variant: 'default', label: 'Cancelled' },
  escalated: { variant: 'purple', label: 'Escalated', pulse: true },
  // Deliverable statuses
  in_review: { variant: 'info', label: 'In Review', pulse: true },
  approved: { variant: 'success', label: 'Approved' },
  changes_requested: { variant: 'warning', label: 'Changes Requested' },
  done: { variant: 'success', label: 'Done' },
  // Contract statuses
  signed: { variant: 'success', label: 'Signed' },
  unsigned: { variant: 'warning', label: 'Awaiting Signature', pulse: true },
  // Scope alert statuses
  active: { variant: 'danger', label: 'Active', pulse: true },
  acknowledged: { variant: 'warning', label: 'Acknowledged' },
  resolved: { variant: 'success', label: 'Resolved' },
  critical: { variant: 'danger', label: 'Critical', pulse: true },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} pulse={config.pulse} className={className}>
      {config.label}
    </Badge>
  );
}
```

**Step 2: Create AnimatedNumber**

```tsx
// components/shared/animated-number.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'currency' | 'percentage' | 'integer';
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  format = 'integer',
  prefix = '',
  className,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });

    const unsubscribe = motionValue.on('change', (latest) => {
      if (ref.current) {
        let formatted: string;
        if (format === 'currency') {
          formatted = prefix + latest.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else if (format === 'percentage') {
          formatted = latest.toFixed(1) + '%';
        } else {
          formatted = Math.round(latest).toLocaleString();
        }
        ref.current.textContent = formatted;
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, format, prefix, motionValue]);

  return <span ref={ref} className={className}>0</span>;
}
```

**Step 3: Create MetricCard**

```tsx
// components/shared/metric-card.tsx
'use client';

import { AnimatedNumber } from './animated-number';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'percentage' | 'integer';
  prefix?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  className?: string;
}

export function MetricCard({ label, value, format = 'integer', prefix, trend, className }: MetricCardProps) {
  return (
    <div className={`rounded-lg border border-border-default bg-bg-secondary p-5 ${className || ''}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <AnimatedNumber
          value={value}
          format={format}
          prefix={prefix}
          className="text-2xl font-semibold tracking-tight text-text-primary"
        />
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trend.direction === 'up' ? 'text-accent-green' : 'text-accent-red'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create GlassCard**

```tsx
// components/shared/glass-card.tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-glass-border bg-glass-bg backdrop-blur-xl p-5',
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Step 5: Create EmptyState**

```tsx
// components/shared/empty-state.tsx
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-xl bg-bg-tertiary p-4 mb-4">
        <Icon className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="text-md font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>
      {actionLabel && (
        actionHref ? (
          <Button variant="primary" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  );
}
```

**Step 6: Create LoadingSkeleton**

```tsx
// components/shared/loading-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 rounded-md" />
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-md" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(cards)].map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
  );
}
```

**Step 7: Commit**

```bash
git add components/shared/
git commit -m "feat: add shared components (status-badge, metric-card, animated-number, glass-card, empty-state, loading-skeleton)"
```

---

## Task 7: Auth Page Overhaul

**Files:**
- Modify: `app/auth/signin/page.tsx`

**Step 1: Redesign sign-in page with dark-first glass card aesthetic**

```tsx
// app/auth/signin/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-accent-blue flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-text-primary">Agency OS</span>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-glass-border bg-glass-bg backdrop-blur-xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-text-primary">Welcome back</h1>
            <p className="text-sm text-text-secondary mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-md bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-6">
          Agency management, simplified.
        </p>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify — visit /auth/signin, check glass card, ambient gradient, animations**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add app/auth/signin/page.tsx
git commit -m "feat: redesign auth page with dark glass card aesthetic and ambient gradients"
```

---

## Tasks 8-16: Page Overhauls

**Due to plan size, Tasks 8-16 follow the same pattern. Each task:**
1. Read the existing page file
2. Rewrite using design system components (Card, Badge, Button, Input, PageHeader, etc.)
3. Wrap content in PageTransition and StaggerChildren for animations
4. Use StatusBadge for all status displays
5. Use MetricCard for dashboard stats
6. Use EmptyState for empty lists
7. Add loading skeletons
8. Verify visually in browser
9. Commit

### Task 8: Dashboard Home (`app/dashboard/page.tsx`)
- Hero metrics row with 4 MetricCards (animated count-up numbers)
- Quick actions grid with glass cards
- Recent activity feed with timeline dots
- Stagger-in animations for all cards

### Task 9: Clients Pages
- `app/dashboard/clients/page.tsx` — Grid of client cards with avatar circles, search bar, EmptyState
- `app/dashboard/clients/[id]/page.tsx` — Header with StatusBadge, tab navigation (Radix Tabs)
- `app/dashboard/clients/new/page.tsx` — Glass card form with dark Input components

### Task 10: Plans Pages
- `app/dashboard/plans/page.tsx` — Card grid with plan name, price, deliverable count
- `app/dashboard/plans/[id]/page.tsx` — Plan detail with deliverable items
- `app/dashboard/plans/new/page.tsx` — Form with dark Inputs

### Task 11: Invoices Pages
- `app/dashboard/invoices/page.tsx` — Table with sortable columns, StatusBadge, filter bar
- `app/dashboard/invoices/[id]/page.tsx` — Clean invoice card, payment methods, status timeline
- `app/dashboard/invoices/[id]/pay/page.tsx` — Payment form on glass card

### Task 12: Deliverables Pages
- `app/dashboard/deliverables/page.tsx` — Card/table view with StatusBadge, client filter
- `app/dashboard/deliverables/[id]/page.tsx` — Status stepper, file upload, comments thread

### Task 13: Contracts Pages
- `app/dashboard/contracts/page.tsx` — Card grid with signed/pending StatusBadge
- `app/dashboard/contracts/upload/page.tsx` — Drag-and-drop zone with animated dashed border

### Task 14: Metrics Dashboard
- `app/dashboard/metrics/page.tsx` — MetricCards with animated numbers, time range selector
- `components/MetricsDashboard.tsx` — Charts with animated draw-in, risk matrix

### Task 15: Settings + Portal Pages
- `app/dashboard/settings/payments/page.tsx` — Integration cards with connected/disconnected states
- `app/portal/[clientToken]/deliverables/page.tsx` — Clean client portal view

### Task 16: Polish Pass
- Responsive testing on mobile/tablet/desktop
- Verify no horizontal scroll on any page
- Check all animations at 60fps
- Verify dark/light mode toggle works everywhere
- Lighthouse accessibility audit (target >95)
- Check keyboard navigation and focus states
- Fix any visual inconsistencies found

---

## Execution Notes

### For each page overhaul (Tasks 8-15):

1. **Read the existing page first** — understand the data it fetches and Server Actions it uses
2. **Keep all data fetching and Server Actions unchanged** — only modify JSX/styling
3. **Import from design system:**
   ```tsx
   import { PageTransition } from '@/components/motion/page-transition';
   import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children';
   import { FadeIn } from '@/components/motion/fade-in';
   import { PageHeader } from '@/components/layout/page-header';
   import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { Badge } from '@/components/ui/badge';
   import { Input } from '@/components/ui/input';
   import { StatusBadge } from '@/components/shared/status-badge';
   import { MetricCard } from '@/components/shared/metric-card';
   import { EmptyState } from '@/components/shared/empty-state';
   ```
4. **Pattern for every page:**
   ```tsx
   export default function SomePage() {
     return (
       <PageTransition>
         <PageHeader title="..." actions={<Button>...</Button>} />
         <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StaggerItem><Card>...</Card></StaggerItem>
           <StaggerItem><Card>...</Card></StaggerItem>
         </StaggerChildren>
       </PageTransition>
     );
   }
   ```

### Delete old Navigation component

After Task 5 (sidebar), delete `components/Navigation.tsx` — it's replaced by the sidebar.

---

## Ready for Execution

Plan complete and saved to `docs/plans/2026-03-01-uiux-overhaul-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
