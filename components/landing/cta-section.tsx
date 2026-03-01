'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/scroll-reveal';

export function CtaSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: '#060609' }}>
      {/* Background effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,112,243,0.07) 0%, rgba(124,58,237,0.04) 40%, transparent 70%)',
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
              background: 'rgba(0, 112, 243, 0.1)',
              border: '1px solid rgba(0, 112, 243, 0.25)',
              boxShadow: '0 0 30px rgba(0, 112, 243, 0.15)',
            }}
          >
            <Sparkles size={22} style={{ color: '#60a5fa' }} />
          </div>

          {/* Headline */}
          <h2
            className="text-4xl md:text-6xl font-black tracking-[-0.04em] text-white leading-[1.05]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ready to run your
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              agency smarter?
            </span>
          </h2>

          <p className="mt-6 text-lg md:text-xl leading-relaxed" style={{ color: '#6b7280' }}>
            Join agencies that run their business on Agency OS.
            <br className="hidden md:block" />
            Start free today — no credit card required.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-white rounded-2xl transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #0070f3, #7c3aed)',
                boxShadow: '0 0 40px rgba(0, 112, 243, 0.35), 0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              Get Started Free
              <ArrowRight size={17} />
            </Link>

            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              Learn more
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-7 text-sm" style={{ color: '#444455' }}>
            Free plan includes 3 clients · No setup fees · Cancel anytime
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
