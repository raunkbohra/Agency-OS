'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
}

interface Agency {
  name: string;
  plans: Plan[];
}

export default function OnboardPage() {
  const params = useParams();
  const agencyId = params.agencyId as string;

  const [agency, setAgency] = useState<Agency | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', companyName: '', phone: '', planId: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/onboard/${agencyId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else setAgency(d);
      })
      .catch(() => setNotFound(true));
  }, [agencyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/onboard/${agencyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue transition-colors';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5';

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
          <div className="h-12 w-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">Link not found</h1>
          <p className="text-text-secondary text-sm">This onboarding link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 w-full max-w-md shadow-xl">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-xl bg-bg-tertiary animate-pulse" />
            <div className="h-5 w-40 bg-bg-tertiary rounded-md animate-pulse" />
            <div className="h-4 w-56 bg-bg-tertiary rounded-md animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-3.5 w-20 bg-bg-tertiary rounded animate-pulse mb-1.5" />
                <div className="h-10 bg-bg-tertiary rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
          <div className="h-14 w-14 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-5">
            <svg className="h-7 w-7 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">You&apos;re all set!</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            <span className="text-text-primary font-medium">{agency.name}</span> will be in touch shortly.
          </p>
          <p className="text-text-tertiary text-xs mt-4">Check your email for a confirmation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-accent-blue flex items-center justify-center mb-4 shadow-lg shadow-accent-blue/20">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{agency.name}</h1>
          <p className="text-text-secondary text-sm mt-2 leading-relaxed">
            Join {agency.name} — fill in your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name <span className="text-accent-red">*</span>
            </label>
            <input
              id="name" type="text" required placeholder="Jane Smith"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address <span className="text-accent-red">*</span>
            </label>
            <input
              id="email" type="email" required placeholder="jane@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="companyName" className={labelClass}>
              Company Name <span className="text-text-tertiary font-normal text-xs">(optional)</span>
            </label>
            <input
              id="companyName" type="text" placeholder="Acme Corp"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone Number <span className="text-text-tertiary font-normal text-xs">(optional)</span>
            </label>
            <input
              id="phone" type="tel" placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Plan selection — only shown if agency has plans */}
          {agency.plans.length > 0 && (
            <div>
              <label className={labelClass}>
                Plan <span className="text-text-tertiary font-normal text-xs">(optional)</span>
              </label>
              <div className="space-y-2">
                {agency.plans.map(plan => (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      form.planId === plan.id
                        ? 'border-accent-blue bg-accent-blue/5'
                        : 'border-border-default bg-bg-primary hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        form.planId === plan.id ? 'border-accent-blue' : 'border-border-hover'
                      }`}>
                        {form.planId === plan.id && (
                          <div className="h-2 w-2 rounded-full bg-accent-blue" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-text-tertiary truncate mt-0.5">{plan.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text-primary">
                        NPR {Number(plan.price).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-text-tertiary capitalize">{plan.billing_cycle}</p>
                    </div>
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={form.planId === plan.id}
                      onChange={() => setForm(f => ({ ...f, planId: plan.id }))}
                      className="sr-only"
                    />
                  </label>
                ))}

                {/* Deselect option */}
                {form.planId && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, planId: '' }))}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2.5 text-sm font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              'Get Started →'
            )}
          </button>
        </form>

        <p className="text-center text-text-tertiary text-xs mt-6">
          Your information is kept private and only shared with {agency.name}.
        </p>
      </div>
    </div>
  );
}
