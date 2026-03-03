import { PageHero } from '@/components/landing/page-hero';
import { ContentSection } from '@/components/landing/content-section';
import { ContactForm } from '@/components/landing/contact-form';
import { Mail, Globe } from 'lucide-react';

export default function ContactPage() {
  return (
    <>
      <PageHero badge="Contact" title="Get in touch" subtitle="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible." />

      <ContentSection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          {/* Form Column */}
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Send us a message</h2>
            <ContactForm />
          </div>

          {/* Info Column */}
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Other ways to reach us</h2>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Mail size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>Email</h3>
                  <a href="mailto:hello@agencyos.dev" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
                    hello@agencyos.dev
                  </a>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Globe size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 600 }}>Response Time</h3>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>We typically respond within 24 hours</p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              borderRadius: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              marginTop: '2rem',
            }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Whether you're interested in learning more about Agency OS, have a question, or want to explore a partnership, we're here to help. Fill out the form and let's start a conversation.
              </p>
            </div>
          </div>
        </div>
      </ContentSection>
    </>
  );
}
