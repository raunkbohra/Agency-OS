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
