// components/landing/pricing.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PricingData {
  country: string;
  region: 'global' | 'india' | 'nepal';
  currency: string;
}

interface Plan {
  tier: 'basic' | 'pro';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export function Pricing() {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          setPricing(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const response = await fetch('/api/user-location');
        const data = await response.json();
        setPricing(data);
        localStorage.setItem('userLocation', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to detect location:', error);
        setPricing({ country: 'Unknown', region: 'global', currency: 'USD' });
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, []);

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '5rem 1.5rem',
        fontSize: '1rem',
        color: 'var(--text-secondary)',
      }}>
        Loading pricing...
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  const priceMap = {
    global: { basic: { monthly: 9, yearly: 86 }, pro: { monthly: 39, yearly: 374 } },
    india: { basic: { monthly: 199, yearly: 1910 }, pro: { monthly: 699, yearly: 6710 } },
    nepal: { basic: { monthly: 399, yearly: 3830 }, pro: { monthly: 1299, yearly: 12470 } },
  };

  const prices = priceMap[pricing.region];

  const plans: Plan[] = [
    {
      tier: 'basic',
      monthlyPrice: prices.basic.monthly,
      yearlyPrice: prices.basic.yearly,
      features: ['15 clients', '50 plans', '5 team members', 'Invoicing', 'Basic reporting'],
    },
    {
      tier: 'pro',
      monthlyPrice: prices.pro.monthly,
      yearlyPrice: prices.pro.yearly,
      features: ['Unlimited clients', 'Unlimited plans', 'Unlimited team members', 'Contracts', 'Advanced reporting', 'API access', 'Priority support'],
    },
  ];

  return (
    <section style={{
      position: 'relative',
      padding: '5rem 1.5rem',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, rgba(59, 130, 246, 0.03) 100%)',
      overflow: 'hidden',
    }}>
      {/* Decorative geometric shapes */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div className="mx-auto max-w-6xl" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem', animation: 'fadeInDown 0.8s ease-out' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
            fontFamily: '"Playfair Display", serif',
          }}>
            Pricing for {pricing.country}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            fontWeight: '500',
          }}>
            All prices in {pricing.currency}
          </p>
          <div style={{
            width: '60px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, var(--accent-blue), transparent)',
            margin: '1rem auto 0',
          }} />
        </div>

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem',
        }}>
          {plans.map((plan, idx) => (
            <div
              key={plan.tier}
              style={{
                animation: `fadeInUp 0.8s ease-out ${idx * 0.2}s both`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '2.5rem',
                  background: `linear-gradient(135deg, var(--landing-card-bg) 0%, rgba(59, 130, 246, ${plan.tier === 'pro' ? '0.05' : '0.02'}) 100%)`,
                  border: plan.tier === 'pro'
                    ? '2px solid var(--accent-blue)'
                    : '1px solid var(--landing-card-border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  transform: plan.tier === 'pro' ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-8px) scale(1.02)';
                  el.style.boxShadow = '0 20px 60px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = plan.tier === 'pro' ? 'scale(1.02)' : 'scale(1)';
                  el.style.boxShadow = 'none';
                }}
              >
                {/* Pro badge */}
                {plan.tier === 'pro' && (
                  <div style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, var(--accent-blue), rgba(59, 130, 246, 0.8))',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    borderRadius: '50px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    Most Popular
                  </div>
                )}

                {/* Tier name */}
                <h3 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '1.5rem',
                  textTransform: 'capitalize',
                  fontFamily: '"Playfair Display", serif',
                }}>
                  {plan.tier}
                </h3>

                {/* Price section */}
                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--landing-card-border)' }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    color: 'var(--accent-blue)',
                    lineHeight: '1.2',
                    marginBottom: '0.5rem',
                  }}>
                    {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'NRs. '}
                    {plan.monthlyPrice}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: '500',
                  }}>
                    per month or {pricing.currency === 'USD' ? '$' : pricing.currency === 'INR' ? '₹' : 'NRs. '}{plan.yearlyPrice}/year
                  </div>
                </div>

                {/* Features list - grows to fill space */}
                <ul style={{ marginBottom: '2rem', flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                      }}
                    >
                      <span style={{
                        color: 'var(--accent-blue)',
                        fontWeight: 'bold',
                        marginTop: '0.125rem',
                        flexShrink: 0,
                      }}>
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - sticky at bottom */}
                <Link
                  href={`/auth/signup?plan=${plan.tier}&region=${pricing.region}`}
                  style={{
                    display: 'block',
                    padding: '1rem 1.5rem',
                    background: plan.tier === 'pro'
                      ? 'linear-gradient(135deg, var(--accent-blue) 0%, rgba(59, 130, 246, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(59, 130, 246, 0.7))',
                    color: 'white',
                    textDecoration: 'none',
                    textAlign: 'center',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.5)';
                    el.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  Get Started
                </Link>

                {/* Decorative corner accent */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '120px',
                  height: '120px',
                  background: `linear-gradient(135deg, var(--accent-blue) 0%, transparent 70%)`,
                  opacity: '0.05',
                  borderRadius: '0 20px 0 100px',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Included in all plans */}
        <div style={{
          padding: '2.5rem',
          background: `linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)`,
          border: '1px solid var(--landing-card-border)',
          borderRadius: '20px',
          textAlign: 'center',
          animation: 'fadeInUp 1.4s ease-out',
          backdropFilter: 'blur(10px)',
        }}>
          <h4 style={{
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            fontWeight: '700',
            fontSize: '1.125rem',
          }}>
            All plans include
          </h4>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            fontWeight: '500',
          }}>
            Free tier for testing • Client portals • Invoicing • Payment processing • Email support
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
