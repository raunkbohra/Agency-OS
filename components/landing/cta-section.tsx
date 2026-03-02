'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SparkleButton } from '@/components/ui/sparkle-button';

export function CtaSection() {
  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(107,126,147,0.07) 0%, rgba(143,160,176,0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent)',
        }}
      />

      <ScrollReveal>
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-8 mx-auto"
            style={{
              background: 'rgba(107, 126, 147, 0.1)',
              border: '1px solid rgba(107, 126, 147, 0.25)',
              boxShadow: '0 0 30px rgba(107, 126, 147, 0.15)',
            }}
          >
            <Sparkles size={22} style={{ color: '#b0bec8' }} />
          </div>

          {/* Headline */}
          <h2
            className="text-3xl sm:text-4xl md:text-6xl font-black tracking-[-0.04em] leading-[1.05]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}
          >
            Ready to run your
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #b0bec8, #c4d0d8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              agency smarter?
            </span>
          </h2>

          <p className="mt-6 text-lg md:text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Join agencies that run their business on Agency OS.
            <br className="hidden md:block" />
            Start free today — no credit card required.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <SparkleButton href="/auth/signin" large>
              Get Started Free
              <ArrowRight size={17} />
            </SparkleButton>

            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--landing-card-bg)',
                border: '1px solid var(--landing-card-border)',
                color: 'var(--landing-secondary-btn-color)',
              }}
            >
              Learn more
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-7 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Free plan includes 3 clients · No setup fees · Cancel anytime
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
